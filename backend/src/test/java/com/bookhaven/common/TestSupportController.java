package com.bookhaven.common;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Test-only controller (lives in {@code src/test}, so it never ships). Its routes are under
 * {@code /test-support}, outside {@code /api/}, so the contract test never sees them.
 */
@RestController
@RequestMapping(path = "/test-support", produces = MediaType.APPLICATION_JSON_VALUE)
public class TestSupportController {

  public record SampleRequest(@NotBlank String name, @Min(1) int count) {}

  @GetMapping("/ok")
  public ApiResponse<Map<String, Integer>> ok() {
    return ApiResponse.ok(Map.of("value", 1));
  }

  @PostMapping(path = "/body", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ApiResponse<Void> body(@Valid @RequestBody SampleRequest request) {
    return ApiResponse.ok();
  }

  @GetMapping("/typed")
  public ApiResponse<Void> typed(@RequestParam("n") int n) {
    return ApiResponse.ok();
  }

  @GetMapping("/rule")
  public ApiResponse<Void> rule() {
    throw AppException.validation(
        List.of(new FieldError("points", "Points exceed the payable amount", "INSUFFICIENT_POINTS")));
  }

  @GetMapping("/conflict")
  public ApiResponse<Void> conflict() {
    throw new AppException(ErrorCode.DUPLICATE_EMAIL, "Email is already registered");
  }

  @GetMapping("/forbidden")
  public ApiResponse<Void> forbidden() {
    throw new AppException(ErrorCode.FORBIDDEN, "Access denied");
  }

  @GetMapping("/boom")
  public ApiResponse<Void> boom() {
    throw new IllegalStateException("database password is hunter2 at jdbc:postgresql://secret-host");
  }
}
