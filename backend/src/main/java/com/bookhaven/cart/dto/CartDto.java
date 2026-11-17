package com.bookhaven.cart.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CartDto(
    List<CartItemDto> items,
    int itemCount,
    boolean hasPhysical,
    boolean hasDigital,
    BigDecimal subtotal,
    BigDecimal shippingAmount,
    BigDecimal freeShippingThreshold,
    BigDecimal freeShippingRemaining,
    BigDecimal total,
    int pointsToEarn,
    UUID defaultAddressId) {}
