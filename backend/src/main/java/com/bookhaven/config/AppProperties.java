package com.bookhaven.config;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Typed binding for every {@code app.*} setting. Secrets arrive only from environment variables. */
@ConfigurationProperties(prefix = "app")
public record AppProperties(
    Jwt jwt, Cors cors, Orders orders, Fulfilment fulfilment, Delivery delivery, Shipping shipping) {

  /** {@code secret} is never logged or returned; {@code toString} hides it. */
  public record Jwt(String secret, long expirationMs) {
    @Override
    public String toString() {
      return "Jwt[expirationMs=" + expirationMs + "]";
    }
  }

  public record Cors(String allowedOrigin) {}

  public record Orders(int expiryMinutes) {}

  public record Fulfilment(
      int processingOffsetHours,
      int shippedOffsetHours,
      int deliveredDayOffset,
      LocalTime deliveredTime) {}

  public record Delivery(
      int cutoffHour,
      int handlingDays,
      int metroTransitDays,
      int otherTransitDays,
      List<String> metroPrefixes,
      String defaultPincode) {}

  public record Shipping(BigDecimal freeThreshold, BigDecimal flatCharge) {}
}
