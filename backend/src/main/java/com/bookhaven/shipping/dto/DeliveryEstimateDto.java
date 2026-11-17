package com.bookhaven.shipping.dto;

import java.time.LocalDate;

public record DeliveryEstimateDto(String pincode, LocalDate deliveryDate, String message) {}
