package com.bookhaven.catalog.dto;

import java.util.UUID;

public record AuthorDto(UUID id, String name, String slug, String imageUrl, String bio, Boolean following) {}
