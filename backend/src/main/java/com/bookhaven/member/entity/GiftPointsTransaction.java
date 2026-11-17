package com.bookhaven.member.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "gift_points_transaction")
public class GiftPointsTransaction {

  public enum Reason {
    REDEEMED,
    EARNED,
    RESTORED_ON_FAILURE,
    RESTORED_ON_CANCEL
  }

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "member_id", nullable = false)
  private UUID memberId;

  @Column(name = "order_id")
  private UUID orderId;

  /** Signed: negative when points are spent. */
  @Column(nullable = false)
  private int points;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private Reason reason;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected GiftPointsTransaction() {}

  public GiftPointsTransaction(
      UUID memberId, UUID orderId, int points, Reason reason, Instant createdAt) {
    this.memberId = memberId;
    this.orderId = orderId;
    this.points = points;
    this.reason = reason;
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

  public UUID getOrderId() {
    return orderId;
  }

  public int getPoints() {
    return points;
  }

  public Reason getReason() {
    return reason;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
