package com.bookhaven.order.service;

import com.bookhaven.order.entity.OrderStatus;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class OrderStateMachine {

  private static final Map<OrderStatus, Set<OrderStatus>> TRANSITIONS = Map.of(
      OrderStatus.PENDING, Set.of(OrderStatus.CONFIRMED, OrderStatus.DELIVERED, OrderStatus.FAILED),
      OrderStatus.CONFIRMED, Set.of(OrderStatus.PROCESSING, OrderStatus.DELIVERED, OrderStatus.CANCELLED),
      OrderStatus.PROCESSING, Set.of(OrderStatus.SHIPPED, OrderStatus.CANCELLED),
      OrderStatus.SHIPPED, Set.of(OrderStatus.DELIVERED, OrderStatus.CANCELLED),
      OrderStatus.DELIVERED, Set.of(),
      OrderStatus.CANCELLED, Set.of(),
      OrderStatus.FAILED, Set.of());

  public boolean canTransition(OrderStatus from, OrderStatus to) {
    if (from == null || to == null) {
      return false;
    }
    return TRANSITIONS.getOrDefault(from, Set.of()).contains(to);
  }
}
