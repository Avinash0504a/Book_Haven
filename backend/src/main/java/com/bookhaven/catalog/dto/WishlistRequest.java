package com.bookhaven.catalog.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record WishlistRequest(
    @NotNull(message = "bookId is required") UUID bookId) {}
