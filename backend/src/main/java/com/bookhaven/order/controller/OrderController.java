package com.bookhaven.order.controller;

import com.bookhaven.common.ApiResponse;
import com.bookhaven.order.dto.BuyAgainResult;
import com.bookhaven.order.dto.CancelPreviewDto;
import com.bookhaven.order.dto.CancelRequest;
import com.bookhaven.order.dto.OrderDto;
import com.bookhaven.order.service.CancellationService;
import com.bookhaven.order.service.OrderService;
import com.bookhaven.security.CurrentMember;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/orders", produces = MediaType.APPLICATION_JSON_VALUE)
public class OrderController {

  private final OrderService orderService;
  private final CancellationService cancellationService;
  private final CurrentMember currentMember;

  public OrderController(
      OrderService orderService,
      CancellationService cancellationService,
      CurrentMember currentMember) {
    this.orderService = orderService;
    this.cancellationService = cancellationService;
    this.currentMember = currentMember;
  }

  @GetMapping
  public ApiResponse<List<OrderDto>> listOrders() {
    return ApiResponse.ok(orderService.listOrders(currentMember.id()));
  }

  @GetMapping("/{id}")
  public ApiResponse<OrderDto> getOrder(@PathVariable("id") UUID id) {
    return ApiResponse.ok(orderService.getOrder(currentMember.id(), id));
  }

  @PostMapping("/{id}/buy-again")
  public ApiResponse<BuyAgainResult> buyAgain(@PathVariable("id") UUID id) {
    return ApiResponse.ok(orderService.buyAgain(currentMember.id(), id));
  }

  @GetMapping("/{id}/cancel-preview")
  public ApiResponse<CancelPreviewDto> cancelPreview(
      @PathVariable("id") UUID id,
      @RequestParam(name = "items", required = false) List<String> items) {
    return ApiResponse.ok(cancellationService.cancelPreview(currentMember.id(), id, items));
  }

  @PostMapping(path = "/{id}/cancel", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ApiResponse<OrderDto> cancelOrder(
      @PathVariable("id") UUID id,
      @Valid @RequestBody CancelRequest request) {
    return ApiResponse.ok(cancellationService.cancelOrder(currentMember.id(), id, request));
  }
}
