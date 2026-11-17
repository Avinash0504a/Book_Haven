package com.bookhaven.shipping;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bookhaven.catalog.entity.BookFormat;
import com.bookhaven.common.AppException;
import com.bookhaven.config.AppProperties;
import com.bookhaven.shipping.dto.DeliveryEstimateDto;
import com.bookhaven.shipping.service.DeliveryEstimator;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class DeliveryEstimatorUT {

  private static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");
  private AppProperties properties;

  @BeforeEach
  void setUp() {
    properties =
        new AppProperties(
            null,
            null,
            null,
            null,
            new AppProperties.Delivery(
                14,
                1,
                2,
                4,
                List.of("110", "400", "411", "500", "560", "600", "700", "380"),
                "110001"),
            new AppProperties.Shipping(new BigDecimal("500"), new BigDecimal("49")));
  }

  @Test
  void cutoffAfterTwoPm() {
    // 2026-11-16 is Monday.
    // 13:59 -> same day dispatch -> handling 1 + metro transit 2 = 3 days -> Thursday 2026-11-19
    Clock clockBefore = Clock.fixed(Instant.parse("2026-11-16T08:29:00Z"), ZONE); // 13:59 IST
    DeliveryEstimator estimatorBefore = new DeliveryEstimator(properties, clockBefore);
    LocalDate dateBefore = estimatorBefore.estimateDeliveryDate("110001", BookFormat.PAPERBACK);
    assertThat(dateBefore).isEqualTo(LocalDate.of(2026, 11, 19));

    // 14:01 -> next day dispatch (Tuesday 2026-11-17) -> handling 1 + metro transit 2 = 3 days -> Friday 2026-11-20
    Clock clockAfter = Clock.fixed(Instant.parse("2026-11-16T08:31:00Z"), ZONE); // 14:01 IST
    DeliveryEstimator estimatorAfter = new DeliveryEstimator(properties, clockAfter);
    LocalDate dateAfter = estimatorAfter.estimateDeliveryDate("110001", BookFormat.PAPERBACK);
    assertThat(dateAfter).isEqualTo(LocalDate.of(2026, 11, 20));
  }

  @Test
  void skipsSunday() {
    // 2026-11-19 is Thursday, 10:00 IST.
    // Dispatch Thursday (Nov 19) + handling 1 + metro transit 2 = Sunday Nov 22.
    // Skipped -> Monday Nov 23.
    Clock clock = Clock.fixed(Instant.parse("2026-11-19T04:30:00Z"), ZONE);
    DeliveryEstimator estimator = new DeliveryEstimator(properties, clock);
    LocalDate date = estimator.estimateDeliveryDate("110001", BookFormat.PAPERBACK);
    assertThat(date).isEqualTo(LocalDate.of(2026, 11, 23));
  }

  @Test
  void metroVsOther() {
    // 2026-11-16 Monday, 10:00 IST.
    // Metro pincode "560001" -> 1 handling + 2 transit = 3 days -> Thursday Nov 19.
    // Non-metro pincode "248001" -> 1 handling + 4 transit = 5 days -> Saturday Nov 21.
    Clock clock = Clock.fixed(Instant.parse("2026-11-16T04:30:00Z"), ZONE);
    DeliveryEstimator estimator = new DeliveryEstimator(properties, clock);

    LocalDate metroDate = estimator.estimateDeliveryDate("560001", BookFormat.PAPERBACK);
    assertThat(metroDate).isEqualTo(LocalDate.of(2026, 11, 19));

    LocalDate otherDate = estimator.estimateDeliveryDate("248001", BookFormat.PAPERBACK);
    assertThat(otherDate).isEqualTo(LocalDate.of(2026, 11, 21));
  }

  @Test
  void digitalHasNone() {
    Clock clock = Clock.fixed(Instant.parse("2026-11-16T04:30:00Z"), ZONE);
    DeliveryEstimator estimator = new DeliveryEstimator(properties, clock);

    assertThat(estimator.estimateDeliveryDate("110001", BookFormat.EBOOK)).isNull();
    assertThat(estimator.estimateDeliveryDate("110001", BookFormat.AUDIOBOOK)).isNull();
  }

  @Test
  void defaultPincode110001() {
    Clock clock = Clock.fixed(Instant.parse("2026-11-16T04:30:00Z"), ZONE);
    DeliveryEstimator estimator = new DeliveryEstimator(properties, clock);

    LocalDate withNull = estimator.estimateDeliveryDate(null, BookFormat.HARDCOVER);
    LocalDate withBlank = estimator.estimateDeliveryDate("   ", BookFormat.HARDCOVER);
    LocalDate withDefault = estimator.estimateDeliveryDate("110001", BookFormat.HARDCOVER);

    assertThat(withNull).isEqualTo(withDefault);
    assertThat(withBlank).isEqualTo(withDefault);
  }

  @Test
  void invalidPincodeThrowsValidationException() {
    Clock clock = Clock.fixed(Instant.parse("2026-11-16T04:30:00Z"), ZONE);
    DeliveryEstimator estimator = new DeliveryEstimator(properties, clock);

    assertThatThrownBy(() -> estimator.estimate("123"))
        .isInstanceOf(AppException.class)
        .hasMessageContaining("Validation failed");

    assertThatThrownBy(() -> estimator.estimate("012345"))
        .isInstanceOf(AppException.class)
        .hasMessageContaining("Validation failed");

    assertThatThrownBy(() -> estimator.estimate("abcde1"))
        .isInstanceOf(AppException.class)
        .hasMessageContaining("Validation failed");
  }

  @Test
  void estimateReturnsFormattedMessage() {
    Clock clock = Clock.fixed(Instant.parse("2026-11-16T04:30:00Z"), ZONE);
    DeliveryEstimator estimator = new DeliveryEstimator(properties, clock);

    DeliveryEstimateDto result = estimator.estimate("110001");
    assertThat(result.pincode()).isEqualTo("110001");
    assertThat(result.deliveryDate()).isEqualTo(LocalDate.of(2026, 11, 19));
    assertThat(result.message()).contains("Thursday, 19 November");
  }
}
