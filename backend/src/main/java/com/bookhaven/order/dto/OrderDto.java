package com.bookhaven.order.dto;

import com.bookhaven.order.entity.OrderStatus;
import com.bookhaven.shipping.dto.AddressDto;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record OrderDto(
    UUID id,
    OrderStatus status,
    List<OrderItemDto> items,
    BigDecimal subtotal,
    BigDecimal shippingAmount,
    int giftPointsUsed,
    BigDecimal discountAmount,
    BigDecimal totalAmount,
    int pointsEarned,
    LocalDate deliveryDate,
    AddressDto address,
    OrderPaymentDto payment,
    Instant createdAt,
    Instant confirmedAt,
    Instant packedAt,
    Instant shippedAt,
    Instant deliveredAt,
    Instant cancelledAt,
    Instant expiresAt,
    boolean cancellable,
    Instant cancelWindowEndsAt,
    String cancelBlockedReason,
    BigDecimal cancellationFee,
    BigDecimal refundAmount,
    List<CancellationDto> cancellations) {}
