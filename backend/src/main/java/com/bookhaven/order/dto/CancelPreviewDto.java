package com.bookhaven.order.dto;

import java.math.BigDecimal;
import java.util.List;

public record CancelPreviewDto(
    boolean cancellable,
    String blockedReason,
    boolean finalCancellation,
    List<CancelLine> lines,
    BigDecimal valueCancelled,
    BigDecimal discountShare,
    BigDecimal feeRate,
    BigDecimal cancellationFee,
    BigDecimal refundAmount,
    int pointsRestored) {}
