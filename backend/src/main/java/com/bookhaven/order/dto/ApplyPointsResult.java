package com.bookhaven.order.dto;

import java.math.BigDecimal;

public record ApplyPointsResult(
    int pointsApplied,
    BigDecimal discountAmount,
    BigDecimal payableAmount,
    int pointsToEarn) {}
