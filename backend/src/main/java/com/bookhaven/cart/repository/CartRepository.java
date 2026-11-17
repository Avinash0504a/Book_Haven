package com.bookhaven.cart.repository;

import com.bookhaven.cart.entity.Cart;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartRepository extends JpaRepository<Cart, UUID> {

  Optional<Cart> findByMemberId(UUID memberId);
}
