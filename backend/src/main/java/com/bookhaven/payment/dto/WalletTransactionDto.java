package com.bookhaven.payment.dto;

import com.bookhaven.member.entity.WalletTxnType;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record WalletTransactionDto(
    UUID id,
    WalletTxnType type,
    BigDecimal amount,
    String source,
    String description,
    Instant createdAt) {}
