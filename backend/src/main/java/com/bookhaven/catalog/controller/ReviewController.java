package com.bookhaven.catalog.controller;

import com.bookhaven.catalog.dto.ReviewDto;
import com.bookhaven.catalog.dto.ReviewRequest;
import com.bookhaven.catalog.service.ReviewService;
import com.bookhaven.common.ApiResponse;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/products/{id}/reviews", produces = MediaType.APPLICATION_JSON_VALUE)
public class ReviewController {

  private final ReviewService reviewService;
  private final CurrentMember currentMember;

  public ReviewController(ReviewService reviewService, CurrentMember currentMember) {
    this.reviewService = reviewService;
    this.currentMember = currentMember;
  }

  @GetMapping
  public ApiResponse<List<ReviewDto>> listReviews(@PathVariable("id") UUID bookId) {
    return ApiResponse.ok(reviewService.listReviews(bookId));
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
  public ApiResponse<ReviewDto> createReview(
      @PathVariable("id") UUID bookId,
      @Valid @RequestBody ReviewRequest request) {
    return ApiResponse.ok(reviewService.createReview(
        currentMember.id(),
        bookId,
        request.rating(),
        request.body()));
  }
}
