package com.bookhaven.cart.dto;

import com.bookhaven.catalog.dto.BookSummary;
import java.math.BigDecimal;
import java.util.UUID;

public record CartItemDto(
    UUID id,
    BookSummary book,
    int quantity,
    int maxQuantity,
    BigDecimal lineTotal) {}
