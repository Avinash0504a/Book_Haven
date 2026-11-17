package com.bookhaven.order.repository;

import com.bookhaven.order.entity.Order;
import com.bookhaven.order.entity.OrderStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, UUID> {

  List<Order> findByMemberIdOrderByCreatedAtDesc(UUID memberId);

  List<Order> findByMemberIdAndStatusIn(UUID memberId, Collection<OrderStatus> statuses);

  List<Order> findByMemberIdAndStatusNotInOrderByCreatedAtDesc(UUID memberId, Collection<OrderStatus> statuses);

  Optional<Order> findByIdAndMemberId(UUID id, UUID memberId);

  Optional<Order> findByIdempotencyKeyAndMemberId(String idempotencyKey, UUID memberId);
}
