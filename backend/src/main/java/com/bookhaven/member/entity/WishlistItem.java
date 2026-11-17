package com.bookhaven.member.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "wishlist_item")
public class WishlistItem {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "member_id", nullable = false)
  private UUID memberId;

  @Column(name = "book_id", nullable = false)
  private UUID bookId;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected WishlistItem() {}

  public WishlistItem(UUID memberId, UUID bookId) {
    this(memberId, bookId, Instant.now());
  }

  public WishlistItem(UUID memberId, UUID bookId, Instant createdAt) {
    this.memberId = memberId;
    this.bookId = bookId;
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

  public UUID getMemberId() {
    return memberId;
  }

  public UUID getBookId() {
    return bookId;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
