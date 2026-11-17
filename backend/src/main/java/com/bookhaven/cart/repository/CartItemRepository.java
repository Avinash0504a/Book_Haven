package com.bookhaven.cart.repository;

import com.bookhaven.cart.entity.CartItem;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, UUID> {

  List<CartItem> findByCartIdOrderByCreatedAtAsc(UUID cartId);

  Optional<CartItem> findByCartIdAndBookId(UUID cartId, UUID bookId);

  /** Ownership: an item is only ever loaded through its own cart. */
  Optional<CartItem> findByIdAndCartId(UUID id, UUID cartId);

  void deleteByCartId(UUID cartId);
}
