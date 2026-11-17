package com.bookhaven.order.dto;

import java.util.List;

public record BuyAgainResult(List<String> added, List<String> unavailable) {}
