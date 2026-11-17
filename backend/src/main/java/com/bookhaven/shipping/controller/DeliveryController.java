package com.bookhaven.shipping.controller;

import com.bookhaven.common.ApiResponse;
import com.bookhaven.shipping.dto.DeliveryEstimateDto;
import com.bookhaven.shipping.service.DeliveryEstimator;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/delivery", produces = MediaType.APPLICATION_JSON_VALUE)
public class DeliveryController {

  private final DeliveryEstimator deliveryEstimator;

  public DeliveryController(DeliveryEstimator deliveryEstimator) {
    this.deliveryEstimator = deliveryEstimator;
  }

  @GetMapping("/estimate")
  public ApiResponse<DeliveryEstimateDto> estimateDelivery(@RequestParam("pincode") String pincode) {
    return ApiResponse.ok(deliveryEstimator.estimate(pincode));
  }
}
