package com.bookhaven.common;

import java.util.List;
import org.springframework.http.HttpStatus;

/** A business error. The HTTP status comes from the {@link ErrorCode}; the message is client-safe. */
public class AppException extends RuntimeException {

  private final ErrorCode code;
  private final List<FieldError> fieldErrors;

  public AppException(ErrorCode code, String message) {
    super(message);
    this.code = code;
    this.fieldErrors = List.of();
  }

  private AppException(ErrorCode code, String message, List<FieldError> fieldErrors) {
    super(message);
    this.code = code;
    this.fieldErrors = fieldErrors;
  }

  /** Every validation failure, including business-rule violations, is a 400 (FR-074a). */
  public static AppException validation(List<FieldError> fieldErrors) {
    return new AppException(ErrorCode.VALIDATION_ERROR, "Validation failed", List.copyOf(fieldErrors));
  }

  public static AppException validation(String field, String message, String reason) {
    return validation(List.of(new FieldError(field, message, reason)));
  }

  public static AppException notFound(String message) {
    return new AppException(ErrorCode.NOT_FOUND, message);
  }

  public static AppException forbidden(String message) {
    return new AppException(ErrorCode.FORBIDDEN, message);
  }

  public ErrorCode code() {
    return code;
  }

  public HttpStatus status() {
    return code.status();
  }

  public List<FieldError> fieldErrors() {
    return fieldErrors;
  }
}
