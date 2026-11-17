package com.bookhaven.order.job;

import com.bookhaven.catalog.entity.BookFormat;
import com.bookhaven.config.AppProperties;
import com.bookhaven.order.entity.Order;
import com.bookhaven.order.entity.OrderItem;
import com.bookhaven.order.entity.OrderStatus;
import com.bookhaven.order.repository.OrderItemRepository;
import com.bookhaven.order.repository.OrderRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class FulfilmentSimulator {

  private static final Logger log = LoggerFactory.getLogger(FulfilmentSimulator.class);
  private static final ZoneId KOLKATA_ZONE = ZoneId.of("Asia/Kolkata");

  private final OrderRepository orderRepository;
  private final OrderItemRepository orderItemRepository;
  private final AppProperties.Fulfilment fulfilmentProperties;
  private final Clock clock;

  public FulfilmentSimulator(
      OrderRepository orderRepository,
      OrderItemRepository orderItemRepository,
      AppProperties appProperties,
      Clock clock) {
    this.orderRepository = orderRepository;
    this.orderItemRepository = orderItemRepository;
    this.fulfilmentProperties = appProperties.fulfilment();
    this.clock = clock;
  }

  @Scheduled(fixedDelay = 60000)
  @Transactional
  public int advanceOrders() {
    Instant now = Instant.now(clock);
    List<Order> activeOrders = orderRepository.findAll().stream()
        .filter(o -> o.getStatus() == OrderStatus.CONFIRMED ||
            o.getStatus() == OrderStatus.PROCESSING ||
            o.getStatus() == OrderStatus.SHIPPED)
        .toList();

    int advancedCount = 0;
    for (Order order : activeOrders) {
      if (advanceOrder(order, now)) {
        advancedCount++;
      }
    }
    return advancedCount;
  }

  public boolean advanceOrder(Order order, Instant now) {
    if (order.getConfirmedAt() == null) {
      return false;
    }

    // Check if order has any physical item
    List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
    boolean hasPhysical = items.stream().anyMatch(i -> {
      BookFormat format = BookFormat.valueOf(i.getFormatSnapshot());
      return format == BookFormat.PAPERBACK || format == BookFormat.HARDCOVER;
    });

    if (!hasPhysical) {
      return false; // Digital-only orders are already DELIVERED
    }

    Instant processingThreshold = order.getConfirmedAt().plus(Duration.ofHours(fulfilmentProperties.processingOffsetHours()));
    Instant shippedThreshold = order.getConfirmedAt().plus(Duration.ofHours(fulfilmentProperties.shippedOffsetHours()));

    ZonedDateTime confirmedZdt = order.getConfirmedAt().atZone(KOLKATA_ZONE);
    LocalDate deliveryDate = confirmedZdt.toLocalDate().plusDays(fulfilmentProperties.deliveredDayOffset());
    LocalTime deliveryTime = fulfilmentProperties.deliveredTime() != null ? fulfilmentProperties.deliveredTime() : LocalTime.of(15, 0);
    Instant deliveredThreshold = deliveryDate.atTime(deliveryTime).atZone(KOLKATA_ZONE).toInstant();

    boolean changed = false;

    if (now.isAfter(deliveredThreshold) || now.equals(deliveredThreshold)) {
      if (order.getStatus() != OrderStatus.DELIVERED) {
        order.setStatus(OrderStatus.DELIVERED);
        if (order.getPackedAt() == null) {
          order.setPackedAt(processingThreshold);
        }
        if (order.getShippedAt() == null) {
          order.setShippedAt(shippedThreshold);
        }
        order.setDeliveredAt(deliveredThreshold);
        orderRepository.save(order);
        changed = true;
      }
    } else if (now.isAfter(shippedThreshold) || now.equals(shippedThreshold)) {
      if (order.getStatus() == OrderStatus.CONFIRMED || order.getStatus() == OrderStatus.PROCESSING) {
        order.setStatus(OrderStatus.SHIPPED);
        if (order.getPackedAt() == null) {
          order.setPackedAt(processingThreshold);
        }
        order.setShippedAt(shippedThreshold);
        orderRepository.save(order);
        changed = true;
      }
    } else if (now.isAfter(processingThreshold) || now.equals(processingThreshold)) {
      if (order.getStatus() == OrderStatus.CONFIRMED) {
        order.setStatus(OrderStatus.PROCESSING);
        order.setPackedAt(processingThreshold);
        orderRepository.save(order);
        changed = true;
      }
    }

    return changed;
  }
}
