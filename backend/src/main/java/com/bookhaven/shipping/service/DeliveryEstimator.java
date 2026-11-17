package com.bookhaven.shipping.service;

import com.bookhaven.catalog.entity.BookFormat;
import com.bookhaven.common.AppException;
import com.bookhaven.config.AppProperties;
import com.bookhaven.shipping.dto.DeliveryEstimateDto;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

/**
 * Calculates delivery dates based on cutoff time, handling days, transit days, and Sunday exclusion (D4).
 */
@Service
public class DeliveryEstimator {

  private static final Pattern PINCODE_PATTERN = Pattern.compile("^[1-9][0-9]{5}$");
  private static final ZoneId KOLKATA_ZONE = ZoneId.of("Asia/Kolkata");
  private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("EEEE, d MMMM");

  private final AppProperties.Delivery deliveryProperties;
  private final Clock clock;

  public DeliveryEstimator(AppProperties appProperties, Clock clock) {
    this.deliveryProperties = appProperties.delivery();
    this.clock = clock;
  }

  public String validateAndResolvePincode(String pincode) {
    if (pincode == null || pincode.isBlank()) {
      return deliveryProperties.defaultPincode();
    }
    if (!PINCODE_PATTERN.matcher(pincode).matches()) {
      throw AppException.validation("pincode", "Must be a 6-digit postal code", "FORMAT");
    }
    return pincode;
  }

  public LocalDate estimateDeliveryDate(String pincode, BookFormat format) {
    if (format == BookFormat.EBOOK || format == BookFormat.AUDIOBOOK) {
      return null;
    }
    String resolvedPincode = validateAndResolvePincode(pincode);
    return calculateDate(resolvedPincode);
  }

  public DeliveryEstimateDto estimate(String pincode) {
    if (pincode == null || !PINCODE_PATTERN.matcher(pincode).matches()) {
      throw AppException.validation("pincode", "Must be a 6-digit postal code", "FORMAT");
    }
    LocalDate deliveryDate = calculateDate(pincode);
    String message = "Delivery by " + deliveryDate.format(DATE_FORMATTER);
    return new DeliveryEstimateDto(pincode, deliveryDate, message);
  }

  private LocalDate calculateDate(String pincode) {
    ZonedDateTime now = ZonedDateTime.now(clock.withZone(KOLKATA_ZONE));
    LocalDate dispatchDay = now.getHour() < deliveryProperties.cutoffHour()
        ? now.toLocalDate()
        : now.toLocalDate().plusDays(1);

    int handling = deliveryProperties.handlingDays();
    int transit = isMetro(pincode)
        ? deliveryProperties.metroTransitDays()
        : deliveryProperties.otherTransitDays();

    LocalDate targetDate = dispatchDay.plusDays((long) handling + transit);
    if (targetDate.getDayOfWeek() == DayOfWeek.SUNDAY) {
      targetDate = targetDate.plusDays(1);
    }
    return targetDate;
  }

  private boolean isMetro(String pincode) {
    List<String> prefixes = deliveryProperties.metroPrefixes();
    if (prefixes == null || prefixes.isEmpty()) {
      return false;
    }
    for (String prefix : prefixes) {
      if (pincode.startsWith(prefix.trim())) {
        return true;
      }
    }
    return false;
  }
}
