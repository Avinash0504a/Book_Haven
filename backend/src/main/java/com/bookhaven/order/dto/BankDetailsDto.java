package com.bookhaven.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record BankDetailsDto(
    @NotBlank(message = "accountHolder is required")
    @Size(min = 2, max = 100, message = "accountHolder must be between 2 and 100 characters")
    String accountHolder,
    @NotBlank(message = "accountNumber is required")
    @Pattern(regexp = "^[0-9]{9,18}$", message = "accountNumber must be between 9 and 18 digits")
    String accountNumber,
    @NotBlank(message = "ifsc is required")
    @Pattern(regexp = "^[A-Z]{4}0[A-Z0-9]{6}$", message = "ifsc must be a valid IFSC code")
    String ifsc) {}
