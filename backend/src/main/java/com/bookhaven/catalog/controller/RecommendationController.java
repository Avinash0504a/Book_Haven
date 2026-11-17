package com.bookhaven.catalog.controller;

import com.bookhaven.catalog.dto.BookSummary;
import com.bookhaven.catalog.service.RecommendationService;
import com.bookhaven.common.ApiResponse;
import com.bookhaven.security.CurrentMember;
import java.util.List;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/recommendations", produces = MediaType.APPLICATION_JSON_VALUE)
public class RecommendationController {

  private final RecommendationService recommendationService;
  private final CurrentMember currentMember;

  public RecommendationController(
      RecommendationService recommendationService,
      CurrentMember currentMember) {
    this.recommendationService = recommendationService;
    this.currentMember = currentMember;
  }

  @GetMapping
  public ApiResponse<List<BookSummary>> recommendations(
      @RequestParam(name = "pincode", required = false) String pincode) {

    UUID memberId = currentMember.find().orElse(null);
    return ApiResponse.ok(recommendationService.getRecommendations(memberId, pincode));
  }
}
