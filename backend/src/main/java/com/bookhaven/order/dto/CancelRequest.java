package com.bookhaven.order.dto;

import com.bookhaven.order.entity.RefundMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public record CancelRequest(
    @NotBlank(message = "reason is required")
    @Size(min = 1, max = 120, message = "reason must be between 1 and 120 characters")
    String reason,
    @Size(max = 300, message = "note cannot exceed 300 characters")
    String note,
    List<@Valid CancelLine> items,
    @NotNull(message = "refundMethod is required") RefundMethod refundMethod,
    @Valid BankDetailsDto bank,
    BigDecimal expectedRefund) {}
