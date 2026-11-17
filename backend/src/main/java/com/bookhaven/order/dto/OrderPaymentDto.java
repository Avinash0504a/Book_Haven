package com.bookhaven.order.dto;

import com.bookhaven.payment.entity.PaymentMethod;

public record OrderPaymentDto(PaymentMethod method, String status, String reference) {}
