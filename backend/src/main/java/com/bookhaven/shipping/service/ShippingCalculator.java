package com.bookhaven.shipping.service;

import com.bookhaven.common.MoneyUtil;
import com.bookhaven.config.AppProperties;
import java.math.BigDecimal;
import org.springframework.stereotype.Service;

@Service
public class ShippingCalculator {

  private final BigDecimal freeThreshold;
  private final BigDecimal flatCharge;

  public ShippingCalculator(AppProperties appProperties) {
    this.freeThreshold = appProperties.shipping().freeThreshold();
    this.flatCharge = appProperties.shipping().flatCharge();
  }

  public record ShippingResult(BigDecimal shippingAmount, BigDecimal freeShippingRemaining) {}

  public ShippingResult calculate(boolean hasPhysical, BigDecimal physicalSubtotal) {
    if (!hasPhysical || physicalSubtotal == null || physicalSubtotal.compareTo(BigDecimal.ZERO) == 0) {
      return new ShippingResult(BigDecimal.ZERO.setScale(2), BigDecimal.ZERO.setScale(2));
    }

    if (physicalSubtotal.compareTo(freeThreshold) >= 0) {
      return new ShippingResult(BigDecimal.ZERO.setScale(2), BigDecimal.ZERO.setScale(2));
    }

    BigDecimal remaining = MoneyUtil.round(freeThreshold.subtract(physicalSubtotal));
    return new ShippingResult(MoneyUtil.round(flatCharge), remaining);
  }

  public BigDecimal freeThreshold() {
    return freeThreshold;
  }

  public BigDecimal flatCharge() {
    return flatCharge;
  }
}
