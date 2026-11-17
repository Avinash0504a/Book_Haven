package com.bookhaven.payment.dto;

import com.bookhaven.payment.entity.PaymentMethod;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record TopUpRequest(
    @NotNull(message = "amount is required")
    @DecimalMin(value = "1.00", message = "amount must be at least 1.00")
    @DecimalMax(value = "100000.00", message = "amount cannot exceed 100,000.00")
    BigDecimal amount,
    @NotNull(message = "paymentMethod is required") PaymentMethod paymentMethod,
    PaymentDetails payment) {}
