package com.bookhaven.catalog.dto;

import jakarta.validation.constraints.NotBlank;

public record FollowRequest(
    @NotBlank(message = "authorSlug is required") String authorSlug) {}
