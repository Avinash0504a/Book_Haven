package com.bookhaven.order.controller;

import com.bookhaven.cart.dto.CartDto;
import com.bookhaven.common.ApiResponse;
import com.bookhaven.order.dto.ApplyPointsRequest;
import com.bookhaven.order.dto.ApplyPointsResult;
import com.bookhaven.order.dto.ConfirmPaymentRequest;
import com.bookhaven.order.dto.CreateOrderRequest;
import com.bookhaven.order.dto.FailPaymentRequest;
import com.bookhaven.order.dto.OrderDto;
import com.bookhaven.order.service.CheckoutService;
import com.bookhaven.payment.dto.BankDto;
import com.bookhaven.security.CurrentMember;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/checkout", produces = MediaType.APPLICATION_JSON_VALUE)
public class CheckoutController {

  private final CheckoutService checkoutService;
  private final CurrentMember currentMember;

  public CheckoutController(CheckoutService checkoutService, CurrentMember currentMember) {
    this.checkoutService = checkoutService;
    this.currentMember = currentMember;
  }

  @PostMapping("/validate")
  public ApiResponse<CartDto> validateCheckout(
      @RequestParam(name = "pincode", required = false) String pincode) {
    return ApiResponse.ok(checkoutService.validateCheckout(currentMember.id(), pincode));
  }

  @GetMapping("/banks")
  public ApiResponse<List<BankDto>> listBanks() {
    return ApiResponse.ok(checkoutService.listBanks());
  }

  @PostMapping(path = "/apply-points", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ApiResponse<ApplyPointsResult> applyPoints(@Valid @RequestBody ApplyPointsRequest request) {
    return ApiResponse.ok(checkoutService.applyPoints(currentMember.id(), request));
  }

  @PostMapping(path = "/order", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ApiResponse<OrderDto> createOrder(
      @RequestHeader("Idempotency-Key") String idempotencyKey,
      @Valid @RequestBody CreateOrderRequest request) {
    return ApiResponse.ok(checkoutService.createOrder(currentMember.id(), idempotencyKey, request));
  }

  @PostMapping(path = "/confirm-payment", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ApiResponse<OrderDto> confirmPayment(@Valid @RequestBody ConfirmPaymentRequest request) {
    return ApiResponse.ok(checkoutService.confirmPayment(currentMember.id(), request));
  }

  @PostMapping(path = "/fail-payment", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ApiResponse<OrderDto> failPayment(@Valid @RequestBody FailPaymentRequest request) {
    return ApiResponse.ok(checkoutService.failPayment(currentMember.id(), request));
  }
}
