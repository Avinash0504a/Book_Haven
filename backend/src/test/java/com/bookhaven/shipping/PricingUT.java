package com.bookhaven.shipping;

import static org.assertj.core.api.Assertions.assertThat;

import com.bookhaven.cart.service.PricingCalculator;
import com.bookhaven.config.AppProperties;
import com.bookhaven.shipping.service.ShippingCalculator;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class PricingUT {

  private PricingCalculator pricingCalculator;
  private ShippingCalculator shippingCalculator;

  @BeforeEach
  void setUp() {
    AppProperties properties =
        new AppProperties(
            null,
            null,
            null,
            null,
            null,
            new AppProperties.Shipping(new BigDecimal("500.00"), new BigDecimal("49.00")));
    shippingCalculator = new ShippingCalculator(properties);
    pricingCalculator = new PricingCalculator(shippingCalculator);
  }

  @Test
  void unitPriceRoundsHalfUp() {
    // 100 with 10% discount -> 90.00
    assertThat(pricingCalculator.unitPrice(new BigDecimal("100.00"), new BigDecimal("10.00")))
        .isEqualTo(new BigDecimal("90.00"));

    // 299 with 15% discount -> 299 * 0.85 = 254.15
    assertThat(pricingCalculator.unitPrice(new BigDecimal("299.00"), new BigDecimal("15.00")))
        .isEqualTo(new BigDecimal("254.15"));

    // 499 with 33.33% discount -> 499 * 0.6667 = 332.6833 -> 332.68
    assertThat(pricingCalculator.unitPrice(new BigDecimal("499.00"), new BigDecimal("33.33")))
        .isEqualTo(new BigDecimal("332.68"));
  }

  @Test
  void shipping49Under500FreeAtOrAbove() {
    // 499.00 physical -> 49 shipping, 1 remaining
    var res499 = pricingCalculator.calculateShipping(true, new BigDecimal("499.00"));
    assertThat(res499.shippingAmount()).isEqualTo(new BigDecimal("49.00"));
    assertThat(res499.freeShippingRemaining()).isEqualTo(new BigDecimal("1.00"));

    // 500.00 physical -> 0 shipping, 0 remaining
    var res500 = pricingCalculator.calculateShipping(true, new BigDecimal("500.00"));
    assertThat(res500.shippingAmount()).isEqualTo(new BigDecimal("0.00"));
    assertThat(res500.freeShippingRemaining()).isEqualTo(new BigDecimal("0.00"));

    // 501.00 physical -> 0 shipping, 0 remaining
    var res501 = pricingCalculator.calculateShipping(true, new BigDecimal("501.00"));
    assertThat(res501.shippingAmount()).isEqualTo(new BigDecimal("0.00"));
    assertThat(res501.freeShippingRemaining()).isEqualTo(new BigDecimal("0.00"));
  }

  @Test
  void digitalOnlyNoShipping() {
    var resDigital = pricingCalculator.calculateShipping(false, new BigDecimal("1200.00"));
    assertThat(resDigital.shippingAmount()).isEqualTo(new BigDecimal("0.00"));
    assertThat(resDigital.freeShippingRemaining()).isEqualTo(new BigDecimal("0.00"));
  }

  @Test
  void mixedCartThresholdUsesPhysicalOnly() {
    // Physical part is 400 (under 500), even if total cart has digital items making it > 500
    var res = pricingCalculator.calculateShipping(true, new BigDecimal("400.00"));
    assertThat(res.shippingAmount()).isEqualTo(new BigDecimal("49.00"));
    assertThat(res.freeShippingRemaining()).isEqualTo(new BigDecimal("100.00"));
  }

  @Test
  void tenPointsOneRupeeAndPointsDiscount() {
    // 100 points = 10 rupees discount on 500 subtotal
    var res = pricingCalculator.calculatePoints(new BigDecimal("500.00"), 100, 200);
    assertThat(res.pointsUsed()).isEqualTo(100);
    assertThat(res.discountAmount()).isEqualTo(new BigDecimal("10.00"));
    assertThat(res.payableAmount()).isEqualTo(new BigDecimal("490.00"));
    assertThat(res.pointsEarned()).isEqualTo(49); // floor(490 / 10)
  }

  @Test
  void pointsEarnedFloor() {
    assertThat(pricingCalculator.calculatePointsToEarn(new BigDecimal("499.99"))).isEqualTo(49);
    assertThat(pricingCalculator.calculatePointsToEarn(new BigDecimal("500.00"))).isEqualTo(50);
    assertThat(pricingCalculator.calculatePointsToEarn(new BigDecimal("509.99"))).isEqualTo(50);
    assertThat(pricingCalculator.calculatePointsToEarn(new BigDecimal("9.99"))).isEqualTo(0);
  }

  @Test
  void pointsCappedAtBalanceAndPayable() {
    // Request 1000 points, balance is 500, total is 300 -> capped at 500 balance, discount 50 -> payable 250
    var res1 = pricingCalculator.calculatePoints(new BigDecimal("300.00"), 1000, 500);
    assertThat(res1.pointsUsed()).isEqualTo(500);
    assertThat(res1.discountAmount()).isEqualTo(new BigDecimal("50.00"));
    assertThat(res1.payableAmount()).isEqualTo(new BigDecimal("250.00"));

    // Request 5000 points, balance is 5000, total is 100 -> only need 1000 points for 100 rupees
    var res2 = pricingCalculator.calculatePoints(new BigDecimal("100.00"), 5000, 5000);
    assertThat(res2.pointsUsed()).isEqualTo(1000);
    assertThat(res2.discountAmount()).isEqualTo(new BigDecimal("100.00"));
    assertThat(res2.payableAmount()).isEqualTo(new BigDecimal("0.00"));
    assertThat(res2.pointsEarned()).isEqualTo(0);
  }

  @Test
  void totalNeverNegative() {
    var res = pricingCalculator.calculatePoints(new BigDecimal("50.00"), 1000, 1000);
    assertThat(res.payableAmount().compareTo(BigDecimal.ZERO)).isGreaterThanOrEqualTo(0);
  }
}
