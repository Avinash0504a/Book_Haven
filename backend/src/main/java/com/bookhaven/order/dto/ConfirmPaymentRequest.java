package com.bookhaven.order.dto;

import com.bookhaven.payment.dto.PaymentDetails;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ConfirmPaymentRequest(
    @NotNull(message = "orderId is required") UUID orderId,
    PaymentDetails payment) {}
