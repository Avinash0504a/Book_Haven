package com.bookhaven.order.dto;

import com.bookhaven.catalog.dto.BookSummary;
import java.time.Instant;
import java.util.UUID;

public record LibraryEntry(
    BookSummary book,
    UUID orderId,
    Instant purchasedAt) {}
