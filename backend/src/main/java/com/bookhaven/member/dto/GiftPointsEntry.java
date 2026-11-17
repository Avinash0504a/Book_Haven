package com.bookhaven.member.dto;

import java.time.Instant;
import java.util.UUID;

public record GiftPointsEntry(
    UUID id,
    int points,
    String reason,
    UUID orderId,
    Instant createdAt,
    Integer balanceAfter) {}
