package com.bookhaven.member.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** FR-001: name 2-100, valid e-mail, password 6-72 (72 is BCrypt's limit). */
public record RegisterRequest(
    @NotBlank @Size(min = 2, max = 100) String fullName,
    @NotBlank @Email @Size(max = 254) String email,
    @NotBlank @Size(min = 6, max = 72) String password) {

  /** The password must never reach a log or an error message through {@code toString}. */
  @Override
  public String toString() {
    return "RegisterRequest[email=<hidden>, password=<hidden>]";
  }
}
