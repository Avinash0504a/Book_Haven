package com.bookhaven.catalog.dto;

import com.bookhaven.catalog.entity.BookFormat;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record BookDetail(
    UUID id,
    String slug,
    String title,
    AuthorSummaryDto author,
    CategoryDto category,
    BookFormat format,
    String language,
    String coverImageUrl,
    BigDecimal price,
    BigDecimal discountPercent,
    BigDecimal unitPrice,
    boolean inStock,
    BigDecimal rating,
    int reviewCount,
    LocalDate deliveryDate,
    Integer cartQuantity,
    Boolean inWishlist,
    String description,
    String isbn,
    BrandDto brand,
    String stockStatus,
    int soldCount,
    AuthorProfileDto writer,
    Boolean notifyRequested) {}
