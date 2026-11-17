package com.bookhaven.catalog.dto;

import java.util.List;
import java.util.UUID;

public record AuthorProfileDto(
    UUID id,
    String name,
    String slug,
    String imageUrl,
    Boolean following,
    String bio,
    List<BookSummary> books) {}
