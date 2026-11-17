package com.bookhaven.order.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CancelLine(
    @NotNull(message = "orderItemId is required") UUID orderItemId,
    @Min(value = 1, message = "quantity must be at least 1") int quantity) {}
