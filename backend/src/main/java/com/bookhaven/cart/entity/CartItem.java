package com.bookhaven.cart.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** A cart line. There is no unit price: the cart always prices from the current book. */
@Entity
@Table(name = "cart_item")
public class CartItem {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "cart_id", nullable = false)
  private UUID cartId;

  @Column(name = "book_id", nullable = false)
  private UUID bookId;

  @Column(nullable = false)
  private int quantity;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected CartItem() {}

  public CartItem(UUID cartId, UUID bookId, int quantity, Instant createdAt) {
    this.cartId = cartId;
    this.bookId = bookId;
    this.quantity = quantity;
    this.createdAt = createdAt;
  }

  @PrePersist
  void ensureCreatedAt() {
    if (createdAt == null) {
      createdAt = Instant.now();
    }
  }

  public UUID getId() {
    return id;
  }

  public UUID getCartId() {
    return cartId;
  }

  public UUID getBookId() {
    return bookId;
  }

  public int getQuantity() {
    return quantity;
  }

  public void setQuantity(int quantity) {
    this.quantity = quantity;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
