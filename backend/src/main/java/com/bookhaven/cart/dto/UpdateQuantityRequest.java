package com.bookhaven.cart.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record UpdateQuantityRequest(
    @Min(value = 0, message = "quantity cannot be negative")
    @Max(value = 10, message = "quantity cannot exceed 10")
    int quantity) {}
