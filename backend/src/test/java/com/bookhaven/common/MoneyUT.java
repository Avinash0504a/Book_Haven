package com.bookhaven.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class MoneyUT {

  @Test
  void roundsHalfUpToTwoDecimals() {
    assertThat(MoneyUtil.round(new BigDecimal("0.005"))).isEqualByComparingTo("0.01");
    assertThat(MoneyUtil.round(new BigDecimal("0.015"))).isEqualByComparingTo("0.02");
    assertThat(MoneyUtil.round(new BigDecimal("1.005"))).isEqualByComparingTo("1.01");
    assertThat(MoneyUtil.round(new BigDecimal("1.004"))).isEqualByComparingTo("1.00");
    assertThat(MoneyUtil.round(new BigDecimal("2"))).hasToString("2.00");
    assertThat(MoneyUtil.round(new BigDecimal("0.005")).scale()).isEqualTo(2);
  }

  @Test
  void unitPriceAppliesDiscountAndRounds() {
    // 259 with 10% off = 233.10; 149.99 with 15% off = 127.4915 -> 127.49
    assertThat(MoneyUtil.unitPrice(new BigDecimal("259.00"), new BigDecimal("10")))
        .isEqualByComparingTo("233.10");
    assertThat(MoneyUtil.unitPrice(new BigDecimal("149.99"), new BigDecimal("15")))
        .isEqualByComparingTo("127.49");
    assertThat(MoneyUtil.unitPrice(new BigDecimal("399.00"), BigDecimal.ZERO))
        .isEqualByComparingTo("399.00");
  }

  @Test
  void neverUsesFloatingPoint() {
    for (Method method : MoneyUtil.class.getDeclaredMethods()) {
      if (!Modifier.isPublic(method.getModifiers())) {
        continue;
      }
      assertThat(method.getReturnType()).isNotIn(double.class, float.class, Double.class, Float.class);
      assertThat(method.getParameterTypes())
          .doesNotContain(double.class, float.class, Double.class, Float.class);
    }
  }
}
