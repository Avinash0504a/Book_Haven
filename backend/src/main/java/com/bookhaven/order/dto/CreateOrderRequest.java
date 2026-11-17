package com.bookhaven.order.dto;

import com.bookhaven.payment.entity.PaymentMethod;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateOrderRequest(
    UUID addressId,
    @NotNull(message = "paymentMethod is required") PaymentMethod paymentMethod,
    @Min(value = 0, message = "giftPointsToUse cannot be negative") int giftPointsToUse) {}
