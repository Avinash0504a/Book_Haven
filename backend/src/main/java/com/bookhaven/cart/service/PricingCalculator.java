package com.bookhaven.cart.service;

import com.bookhaven.common.MoneyUtil;
import com.bookhaven.shipping.service.ShippingCalculator;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.stereotype.Service;

@Service
public class PricingCalculator {

  private static final BigDecimal POINT_VALUE = new BigDecimal("0.10");
  private static final BigDecimal TEN = new BigDecimal("10");

  private final ShippingCalculator shippingCalculator;

  public PricingCalculator(ShippingCalculator shippingCalculator) {
    this.shippingCalculator = shippingCalculator;
  }

  public BigDecimal unitPrice(BigDecimal price, BigDecimal discountPercent) {
    return MoneyUtil.unitPrice(price, discountPercent);
  }

  public BigDecimal lineTotal(BigDecimal unitPrice, int quantity) {
    return MoneyUtil.round(unitPrice.multiply(BigDecimal.valueOf(quantity)));
  }

  public ShippingCalculator.ShippingResult calculateShipping(boolean hasPhysical, BigDecimal physicalSubtotal) {
    return shippingCalculator.calculate(hasPhysical, physicalSubtotal);
  }

  public int calculatePointsToEarn(BigDecimal totalAmount) {
    if (totalAmount == null || totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
      return 0;
    }
    return totalAmount.divideToIntegralValue(TEN).intValue();
  }

  public record PointsResult(int pointsUsed, BigDecimal discountAmount, BigDecimal payableAmount, int pointsEarned) {}

  public PointsResult calculatePoints(BigDecimal subtotalAndShipping, int requestedPoints, int memberPointsBalance) {
    if (requestedPoints <= 0 || memberPointsBalance <= 0 || subtotalAndShipping.compareTo(BigDecimal.ZERO) <= 0) {
      int earned = calculatePointsToEarn(subtotalAndShipping);
      return new PointsResult(0, BigDecimal.ZERO.setScale(2), MoneyUtil.round(subtotalAndShipping), earned);
    }

    // Points cannot exceed member balance
    int pointsCappedByBalance = Math.min(requestedPoints, memberPointsBalance);

    // Max points needed to make payable 0 is subtotalAndShipping * 10
    int maxPointsNeeded = subtotalAndShipping.multiply(TEN).setScale(0, RoundingMode.CEILING).intValue();
    int actualPointsUsed = Math.min(pointsCappedByBalance, maxPointsNeeded);

    BigDecimal discount = MoneyUtil.round(BigDecimal.valueOf(actualPointsUsed).multiply(POINT_VALUE));
    // Discount cannot exceed subtotalAndShipping
    if (discount.compareTo(subtotalAndShipping) > 0) {
      discount = subtotalAndShipping;
    }

    BigDecimal payable = MoneyUtil.round(subtotalAndShipping.subtract(discount));
    if (payable.compareTo(BigDecimal.ZERO) < 0) {
      payable = BigDecimal.ZERO.setScale(2);
    }

    int earned = calculatePointsToEarn(payable);
    return new PointsResult(actualPointsUsed, discount, payable, earned);
  }

  public BigDecimal freeShippingThreshold() {
    return shippingCalculator.freeThreshold();
  }
}
