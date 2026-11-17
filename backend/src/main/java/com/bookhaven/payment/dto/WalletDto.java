package com.bookhaven.payment.dto;

import java.math.BigDecimal;
import java.util.List;

public record WalletDto(BigDecimal balance, List<WalletTransactionDto> transactions) {}
