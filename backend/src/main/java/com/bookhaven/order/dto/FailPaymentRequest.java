package com.bookhaven.order.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record FailPaymentRequest(
    @NotNull(message = "orderId is required") UUID orderId) {}
