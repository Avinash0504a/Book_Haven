package com.bookhaven.order.dto;

import com.bookhaven.catalog.entity.BookFormat;
import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemDto(
    UUID id,
    UUID bookId,
    String title,
    String author,
    BookFormat format,
    String coverImageUrl,
    int quantity,
    int cancelledQuantity,
    BigDecimal unitPrice,
    BigDecimal lineTotal,
    boolean cancellable) {}
