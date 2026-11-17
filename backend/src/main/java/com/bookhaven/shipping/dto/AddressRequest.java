package com.bookhaven.shipping.dto;

import com.bookhaven.shipping.entity.AddressLabel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AddressRequest(
    @NotNull(message = "label is required") AddressLabel label,
    @NotBlank(message = "recipientName is required")
    @Size(min = 2, max = 100, message = "recipientName must be between 2 and 100 characters")
    String recipientName,
    @NotBlank(message = "phone is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "phone must be exactly 10 digits")
    String phone,
    @NotBlank(message = "line1 is required")
    @Size(min = 1, max = 120, message = "line1 must be between 1 and 120 characters")
    String line1,
    @Size(max = 120, message = "line2 cannot exceed 120 characters")
    String line2,
    @NotBlank(message = "city is required")
    @Size(min = 1, max = 60, message = "city must be between 1 and 60 characters")
    String city,
    @NotBlank(message = "state is required")
    @Size(min = 1, max = 60, message = "state must be between 1 and 60 characters")
    String state,
    @NotBlank(message = "postalCode is required")
    @Pattern(regexp = "^[1-9][0-9]{5}$", message = "postalCode must be a valid 6-digit postal code")
    String postalCode,
    String country,
    Boolean isDefault) {}
