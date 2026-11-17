package com.bookhaven.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.Map;

/**
 * The single response envelope: {@code { success, data, message, code }} (FR-073).
 * Null members are omitted from the JSON.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(boolean success, T data, String message, ErrorCode code) {

  public static <T> ApiResponse<T> ok(T data) {
    return new ApiResponse<>(true, data, null, null);
  }

  public static <T> ApiResponse<T> ok() {
    return new ApiResponse<>(true, null, null, null);
  }

  public static ApiResponse<Void> okMessage(String message) {
    return new ApiResponse<>(true, null, message, null);
  }

  public static ApiResponse<Void> error(ErrorCode code, String message) {
    return new ApiResponse<>(false, null, message, code);
  }

  public static ApiResponse<Map<String, Object>> validationError(
      String message, java.util.List<FieldError> fieldErrors) {
    return new ApiResponse<>(
        false, Map.of("fieldErrors", fieldErrors), message, ErrorCode.VALIDATION_ERROR);
  }
}
