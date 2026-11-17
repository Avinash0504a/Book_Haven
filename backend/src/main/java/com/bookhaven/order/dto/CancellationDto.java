package com.bookhaven.order.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CancellationDto(
    UUID id,
    String reason,
    BigDecimal valueCancelled,
    BigDecimal feeRate,
    BigDecimal feeAmount,
    BigDecimal refundAmount,
    int pointsRestored,
    String refundMethod,
    String refundStatus,
    String refundDestination,
    Instant createdAt) {}
