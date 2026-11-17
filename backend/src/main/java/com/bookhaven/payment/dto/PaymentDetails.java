package com.bookhaven.payment.dto;

public record PaymentDetails(
    String cardNumber,
    String cardName,
    String cvv,
    String expiry,
    String upiId,
    String bankCode) {}
