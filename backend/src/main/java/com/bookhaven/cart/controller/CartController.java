package com.bookhaven.cart.controller;

import com.bookhaven.cart.dto.AddCartItemRequest;
import com.bookhaven.cart.dto.CartDto;
import com.bookhaven.cart.dto.UpdateQuantityRequest;
import com.bookhaven.cart.service.CartService;
import com.bookhaven.common.ApiResponse;
import com.bookhaven.security.CurrentMember;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/cart", produces = MediaType.APPLICATION_JSON_VALUE)
public class CartController {

  private final CartService cartService;
  private final CurrentMember currentMember;

  public CartController(CartService cartService, CurrentMember currentMember) {
    this.cartService = cartService;
    this.currentMember = currentMember;
  }

  @GetMapping
  public ApiResponse<CartDto> getCart(
      @RequestParam(name = "pincode", required = false) String pincode) {
    return ApiResponse.ok(cartService.getCart(currentMember.id(), pincode));
  }

  @DeleteMapping
  public ApiResponse<Void> clearCart() {
    cartService.clearCart(currentMember.id());
    return ApiResponse.ok();
  }

  @PostMapping(path = "/items", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ApiResponse<CartDto> addCartItem(
      @Valid @RequestBody AddCartItemRequest request,
      @RequestParam(name = "pincode", required = false) String pincode) {
    return ApiResponse.ok(
        cartService.addCartItem(currentMember.id(), request.bookId(), request.quantity(), pincode));
  }

  @PatchMapping(path = "/items/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ApiResponse<CartDto> updateCartItem(
      @PathVariable("id") UUID id,
      @Valid @RequestBody UpdateQuantityRequest request,
      @RequestParam(name = "pincode", required = false) String pincode) {
    return ApiResponse.ok(
        cartService.updateCartItem(currentMember.id(), id, request.quantity(), pincode));
  }

  @DeleteMapping("/items/{id}")
  public ApiResponse<CartDto> removeCartItem(
      @PathVariable("id") UUID id,
      @RequestParam(name = "pincode", required = false) String pincode) {
    return ApiResponse.ok(cartService.removeCartItem(currentMember.id(), id, pincode));
  }
}
