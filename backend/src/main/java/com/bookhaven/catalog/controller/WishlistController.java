package com.bookhaven.catalog.controller;

import com.bookhaven.catalog.dto.BookSummary;
import com.bookhaven.catalog.dto.WishlistRequest;
import com.bookhaven.catalog.service.WishlistService;
import com.bookhaven.common.ApiResponse;
import com.bookhaven.security.CurrentMember;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/wishlist", produces = MediaType.APPLICATION_JSON_VALUE)
public class WishlistController {

  private final WishlistService wishlistService;
  private final CurrentMember currentMember;

  public WishlistController(WishlistService wishlistService, CurrentMember currentMember) {
    this.wishlistService = wishlistService;
    this.currentMember = currentMember;
  }

  @GetMapping
  public ApiResponse<List<BookSummary>> listWishlist(
      @RequestParam(name = "pincode", required = false) String pincode) {
    return ApiResponse.ok(wishlistService.listWishlist(currentMember.id(), pincode));
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
  public ApiResponse<Void> addWishlistItem(@Valid @RequestBody WishlistRequest request) {
    wishlistService.addWishlistItem(currentMember.id(), request.bookId());
    return ApiResponse.ok();
  }

  @DeleteMapping("/{bookId}")
  public ApiResponse<Void> removeWishlistItem(@PathVariable("bookId") UUID bookId) {
    wishlistService.removeWishlistItem(currentMember.id(), bookId);
    return ApiResponse.ok();
  }
}
