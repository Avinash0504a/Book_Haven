package com.bookhaven.order.dto;

import jakarta.validation.constraints.Min;

public record ApplyPointsRequest(
    @Min(value = 0, message = "points cannot be negative") int points) {}
