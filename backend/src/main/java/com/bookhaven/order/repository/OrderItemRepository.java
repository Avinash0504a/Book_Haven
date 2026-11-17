package com.bookhaven.order.repository;

import com.bookhaven.order.entity.OrderItem;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {

  List<OrderItem> findByOrderId(UUID orderId);

  List<OrderItem> findByOrderIdIn(Collection<UUID> orderIds);
}
