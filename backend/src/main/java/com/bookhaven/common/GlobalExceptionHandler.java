package com.bookhaven.common;

import com.bookhaven.security.CurrentMember;
import com.bookhaven.security.SecurityEventLogger;
import jakarta.validation.ConstraintViolationException;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Turns every failure into the envelope (FR-073, FR-074, FR-074a). Validation is always 400.
 * Unexpected errors return a fixed message; the detail and stack trace go to the server log only.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  static final String INTERNAL_MESSAGE = "Internal server error";

  private final SecurityEventLogger events;
  private final CurrentMember currentMember;

  public GlobalExceptionHandler(SecurityEventLogger events, CurrentMember currentMember) {
    this.events = events;
    this.currentMember = currentMember;
  }

  @ExceptionHandler(AppException.class)
  ResponseEntity<ApiResponse<?>> handleApp(AppException ex) {
    if (ex.code() == ErrorCode.VALIDATION_ERROR) {
      return validation(ex.fieldErrors());
    }
    if (ex.code() == ErrorCode.FORBIDDEN) {
      events.forbidden(currentMember.find().orElse(null));
    }
    return ResponseEntity.status(ex.status()).body(ApiResponse.error(ex.code(), ex.getMessage()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ApiResponse<?>> handleBody(MethodArgumentNotValidException ex) {
    List<FieldError> errors = new ArrayList<>();
    ex.getBindingResult()
        .getFieldErrors()
        .forEach(e -> errors.add(new FieldError(e.getField(), message(e.getDefaultMessage()), reason(e.getCode()))));
    ex.getBindingResult()
        .getGlobalErrors()
        .forEach(e -> errors.add(new FieldError(e.getObjectName(), message(e.getDefaultMessage()), "FORMAT")));
    return validation(errors);
  }

  @ExceptionHandler(HandlerMethodValidationException.class)
  ResponseEntity<ApiResponse<?>> handleMethodValidation(HandlerMethodValidationException ex) {
    List<FieldError> errors = new ArrayList<>();
    ex.getParameterValidationResults()
        .forEach(
            result -> {
              String field = result.getMethodParameter().getParameterName();
              result
                  .getResolvableErrors()
                  .forEach(
                      e ->
                          errors.add(
                              new FieldError(
                                  field == null ? "request" : field,
                                  message(e.getDefaultMessage()),
                                  reason(e.getCodes() == null || e.getCodes().length == 0 ? null : lastSegment(e.getCodes()[e.getCodes().length - 1])))));
            });
    return validation(errors);
  }

  @ExceptionHandler(ConstraintViolationException.class)
  ResponseEntity<ApiResponse<?>> handleConstraint(ConstraintViolationException ex) {
    List<FieldError> errors = new ArrayList<>();
    ex.getConstraintViolations()
        .forEach(
            v -> {
              String path = v.getPropertyPath().toString();
              String field = path.contains(".") ? path.substring(path.lastIndexOf('.') + 1) : path;
              errors.add(
                  new FieldError(
                      field,
                      message(v.getMessage()),
                      reason(v.getConstraintDescriptor().getAnnotation().annotationType().getSimpleName())));
            });
    return validation(errors);
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  ResponseEntity<ApiResponse<?>> handleUnreadable(HttpMessageNotReadableException ex) {
    return validation(List.of(new FieldError("body", "Request body is missing or malformed", "FORMAT")));
  }

  @ExceptionHandler(MethodArgumentTypeMismatchException.class)
  ResponseEntity<ApiResponse<?>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
    return validation(List.of(new FieldError(ex.getName(), "Invalid value", "FORMAT")));
  }

  @ExceptionHandler(MissingServletRequestParameterException.class)
  ResponseEntity<ApiResponse<?>> handleMissingParam(MissingServletRequestParameterException ex) {
    return validation(List.of(new FieldError(ex.getParameterName(), "This value is required", "REQUIRED")));
  }

  @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
  ResponseEntity<ApiResponse<?>> handleMediaType(HttpMediaTypeNotSupportedException ex) {
    return validation(List.of(new FieldError("body", "Unsupported content type", "FORMAT")));
  }

  @ExceptionHandler({NoResourceFoundException.class, HttpRequestMethodNotSupportedException.class})
  ResponseEntity<ApiResponse<?>> handleNoRoute(Exception ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(ApiResponse.error(ErrorCode.NOT_FOUND, "Not found"));
  }

  @ExceptionHandler(AccessDeniedException.class)
  ResponseEntity<ApiResponse<?>> handleDenied(AccessDeniedException ex) {
    events.forbidden(currentMember.find().orElse(null));
    return ResponseEntity.status(HttpStatus.FORBIDDEN)
        .body(ApiResponse.error(ErrorCode.FORBIDDEN, "Access denied"));
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<ApiResponse<?>> handleUnexpected(Exception ex) {
    // Detail and stack trace stay in the server log. The client gets a fixed message.
    log.error("Unhandled exception", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(ApiResponse.error(ErrorCode.INTERNAL_ERROR, INTERNAL_MESSAGE));
  }

  private static ResponseEntity<ApiResponse<?>> validation(List<FieldError> errors) {
    List<FieldError> list =
        errors.isEmpty() ? List.of(new FieldError("request", "Invalid request", "FORMAT")) : errors;
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(ApiResponse.validationError("Validation failed", list));
  }

  private static String message(String defaultMessage) {
    return defaultMessage == null || defaultMessage.isBlank() ? "Invalid value" : defaultMessage;
  }

  private static String lastSegment(String code) {
    int dot = code.lastIndexOf('.');
    return dot < 0 ? code : code.substring(dot + 1);
  }

  /** Maps a Jakarta constraint (or its code) to the stable {@code reason} values of the contract. */
  static String reason(String constraint) {
    if (constraint == null) {
      return "FORMAT";
    }
    return switch (constraint) {
      case "NotNull", "NotBlank", "NotEmpty" -> "REQUIRED";
      case "Min", "Max", "Size", "Range", "DecimalMin", "DecimalMax", "Positive", "PositiveOrZero",
          "Length" -> "RANGE";
      case "Future", "FutureOrPresent", "Past", "PastOrPresent" -> "EXPIRED";
      default -> "FORMAT";
    };
  }
}
