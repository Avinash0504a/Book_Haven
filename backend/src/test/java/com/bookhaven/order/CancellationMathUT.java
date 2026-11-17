package com.bookhaven.order;

import static org.assertj.core.api.Assertions.assertThat;

import com.bookhaven.order.entity.OrderStatus;
import com.bookhaven.order.service.CancellationCalculator;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class CancellationMathUT {

  private final CancellationCalculator calculator = new CancellationCalculator();

  @Test
  void feeTiersByStatus() {
    assertThat(calculator.feeRateForStatus(OrderStatus.CONFIRMED)).isEqualTo(new BigDecimal("0.00"));
    assertThat(calculator.feeRateForStatus(OrderStatus.PROCESSING)).isEqualTo(new BigDecimal("0.10"));
    assertThat(calculator.feeRateForStatus(OrderStatus.SHIPPED)).isEqualTo(new BigDecimal("0.20"));
  }

  @Test
  void refundFormula() {
    // Subtotal 1000, discount 100 (from 1000 points), full cancel at PROCESSING (10% fee)
    // valueCancelled = 1000, discountShare = 100, fee = 100 (1000 * 0.10), refund = 1000 - 100 - 100 = 800
    // pointsRestored = 1000
    var res = calculator.calculate(
        OrderStatus.PROCESSING,
        new BigDecimal("1000.00"),
        new BigDecimal("100.00"),
        1000,
        new BigDecimal("1000.00"));

    assertThat(res.valueCancelled()).isEqualTo(new BigDecimal("1000.00"));
    assertThat(res.discountShare()).isEqualTo(new BigDecimal("100.00"));
    assertThat(res.feeRate()).isEqualTo(new BigDecimal("0.10"));
    assertThat(res.feeAmount()).isEqualTo(new BigDecimal("100.00"));
    assertThat(res.refundAmount()).isEqualTo(new BigDecimal("800.00"));
    assertThat(res.pointsRestored()).isEqualTo(1000);
  }

  @Test
  void pointsRestoredProportional() {
    // Subtotal 1000, discount 100 (1000 points), partial cancel of 500 at CONFIRMED (0% fee)
    // fraction = 0.5 -> discountShare = 50, fee = 0, refund = 450, pointsRestored = 500
    var res = calculator.calculate(
        OrderStatus.CONFIRMED,
        new BigDecimal("1000.00"),
        new BigDecimal("100.00"),
        1000,
        new BigDecimal("500.00"));

    assertThat(res.discountShare()).isEqualTo(new BigDecimal("50.00"));
    assertThat(res.feeAmount()).isEqualTo(new BigDecimal("0.00"));
    assertThat(res.refundAmount()).isEqualTo(new BigDecimal("450.00"));
    assertThat(res.pointsRestored()).isEqualTo(500);
  }

  @Test
  void refundNeverNegative() {
    // Extreme discount: subtotal 100, discount 95, cancel at SHIPPED (20% fee = 20)
    // 100 - 95 - 20 = -15 -> max(0, -15) = 0.00
    var res = calculator.calculate(
        OrderStatus.SHIPPED,
        new BigDecimal("100.00"),
        new BigDecimal("95.00"),
        950,
        new BigDecimal("100.00"));

    assertThat(res.refundAmount()).isEqualTo(new BigDecimal("0.00"));
  }
}
