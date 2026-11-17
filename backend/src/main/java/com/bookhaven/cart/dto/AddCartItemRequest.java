package com.bookhaven.cart.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AddCartItemRequest(
    @NotNull(message = "bookId is required") UUID bookId,
    @Min(value = 1, message = "quantity must be at least 1")
    @Max(value = 10, message = "quantity cannot exceed 10")
    int quantity) {}
