package com.bookhaven.common;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Money is always {@link BigDecimal} with scale 2, rounded HALF_UP. Never float or double. */
public final class MoneyUtil {

  public static final int SCALE = 2;
  private static final BigDecimal HUNDRED = new BigDecimal("100");

  private MoneyUtil() {}

  public static BigDecimal round(BigDecimal value) {
    return value.setScale(SCALE, RoundingMode.HALF_UP);
  }

  /** {@code round(price x (1 - discountPercent / 100), 2)} (FR-032). */
  public static BigDecimal unitPrice(BigDecimal price, BigDecimal discountPercent) {
    BigDecimal factor = BigDecimal.ONE.subtract(discountPercent.divide(HUNDRED));
    return round(price.multiply(factor));
  }
}
