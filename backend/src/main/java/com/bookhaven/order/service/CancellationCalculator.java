package com.bookhaven.order.service;

import com.bookhaven.common.MoneyUtil;
import com.bookhaven.order.entity.OrderStatus;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.stereotype.Service;

@Service
public class CancellationCalculator {

  public record CalculationResult(
      BigDecimal valueCancelled,
      BigDecimal discountShare,
      BigDecimal grossPaid,
      BigDecimal feeRate,
      BigDecimal feeAmount,
      BigDecimal refundAmount,
      int pointsRestored) {}

  public BigDecimal feeRateForStatus(OrderStatus status) {
    if (status == OrderStatus.CONFIRMED) {
      return BigDecimal.ZERO.setScale(2);
    } else if (status == OrderStatus.PROCESSING) {
      return new BigDecimal("0.10");
    } else if (status == OrderStatus.SHIPPED) {
      return new BigDecimal("0.20");
    }
    return BigDecimal.ZERO.setScale(2);
  }

  public CalculationResult calculate(
      OrderStatus status,
      BigDecimal orderSubtotal,
      BigDecimal orderDiscount,
      int orderGiftPointsUsed,
      BigDecimal valueCancelled) {

    if (orderSubtotal == null || orderSubtotal.compareTo(BigDecimal.ZERO) <= 0 ||
        valueCancelled == null || valueCancelled.compareTo(BigDecimal.ZERO) <= 0) {
      return new CalculationResult(
          BigDecimal.ZERO.setScale(2),
          BigDecimal.ZERO.setScale(2),
          BigDecimal.ZERO.setScale(2),
          BigDecimal.ZERO.setScale(2),
          BigDecimal.ZERO.setScale(2),
          BigDecimal.ZERO.setScale(2),
          0);
    }

    BigDecimal discountAmount = orderDiscount == null ? BigDecimal.ZERO : orderDiscount;
    BigDecimal feeRate = feeRateForStatus(status);

    // Fraction = valueCancelled / subtotal
    BigDecimal fraction = valueCancelled.divide(orderSubtotal, 6, RoundingMode.HALF_UP);

    // discountShare = discountAmount * valueCancelled / subtotal
    BigDecimal discountShare = MoneyUtil.round(discountAmount.multiply(fraction));

    // grossPaid = valueCancelled - discountShare
    BigDecimal grossPaid = MoneyUtil.round(valueCancelled.subtract(discountShare));

    // feeAmount = valueCancelled * feeRate
    BigDecimal feeAmount = MoneyUtil.round(valueCancelled.multiply(feeRate));

    // refundAmount = max(0, valueCancelled - discountShare - feeAmount)
    BigDecimal rawRefund = valueCancelled.subtract(discountShare).subtract(feeAmount);
    BigDecimal refundAmount = MoneyUtil.round(rawRefund.max(BigDecimal.ZERO));

    // pointsRestored = round(giftPointsUsed * valueCancelled / subtotal)
    int pointsRestored = BigDecimal.valueOf(orderGiftPointsUsed)
        .multiply(fraction)
        .setScale(0, RoundingMode.HALF_UP)
        .intValue();

    return new CalculationResult(
        MoneyUtil.round(valueCancelled),
        discountShare,
        grossPaid,
        feeRate,
        feeAmount,
        refundAmount,
        pointsRestored);
  }
}
