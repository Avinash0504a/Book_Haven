package com.bookhaven.catalog.dto;

import java.util.List;

public record BookPage(
    List<BookSummary> items,
    long total,
    int page,
    int limit,
    int totalPages) {}
