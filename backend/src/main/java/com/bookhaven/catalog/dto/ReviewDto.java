package com.bookhaven.catalog.dto;

import java.time.Instant;
import java.util.UUID;

public record ReviewDto(
    UUID id,
    String memberName,
    int rating,
    String body,
    Instant createdAt) {}
