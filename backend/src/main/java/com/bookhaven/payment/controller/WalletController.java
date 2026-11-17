package com.bookhaven.payment.controller;

import com.bookhaven.common.ApiResponse;
import com.bookhaven.payment.dto.TopUpRequest;
import com.bookhaven.payment.dto.WalletDto;
import com.bookhaven.payment.service.WalletService;
import com.bookhaven.security.CurrentMember;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/wallet", produces = MediaType.APPLICATION_JSON_VALUE)
public class WalletController {

  private final WalletService walletService;
  private final CurrentMember currentMember;

  public WalletController(WalletService walletService, CurrentMember currentMember) {
    this.walletService = walletService;
    this.currentMember = currentMember;
  }

  @GetMapping
  public ApiResponse<WalletDto> getWallet() {
    return ApiResponse.ok(walletService.getWallet(currentMember.id()));
  }

  @PostMapping("/topup")
  public ApiResponse<WalletDto> topUpWallet(@Valid @RequestBody TopUpRequest request) {
    return ApiResponse.ok(walletService.topUp(
        currentMember.id(),
        request.amount(),
        request.paymentMethod(),
        request.payment()));
  }
}
