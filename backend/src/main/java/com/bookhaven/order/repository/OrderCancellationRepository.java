package com.bookhaven.order.repository;

import com.bookhaven.order.entity.OrderCancellation;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderCancellationRepository extends JpaRepository<OrderCancellation, UUID> {

  List<OrderCancellation> findByOrderIdOrderByCreatedAtAsc(UUID orderId);
}
