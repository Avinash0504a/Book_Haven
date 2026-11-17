package com.bookhaven.order.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** One row per cancel action. The refund destination is stored masked. */
@Entity
@Table(name = "order_cancellation")
public class OrderCancellation {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "order_id", nullable = false)
  private UUID orderId;

  @Column(length = 100)
  private String reason;

  @Column(length = 500)
  private String note;

  @Column(name = "items_json", nullable = false)
  private String itemsJson;

  @Column(name = "value_cancelled", nullable = false, precision = 12, scale = 2)
  private BigDecimal valueCancelled;

  @Column(name = "discount_share", nullable = false, precision = 12, scale = 2)
  private BigDecimal discountShare;

  @Column(name = "gross_paid", nullable = false, precision = 12, scale = 2)
  private BigDecimal grossPaid;

  @Column(name = "fee_rate", nullable = false, precision = 5, scale = 4)
  private BigDecimal feeRate;

  @Column(name = "fee_amount", nullable = false, precision = 12, scale = 2)
  private BigDecimal feeAmount;

  @Column(name = "refund_amount", nullable = false, precision = 12, scale = 2)
  private BigDecimal refundAmount;

  @Column(name = "points_restored", nullable = false)
  private int pointsRestored;

  @Enumerated(EnumType.STRING)
  @Column(name = "refund_method", nullable = false, length = 10)
  private RefundMethod refundMethod;

  @Enumerated(EnumType.STRING)
  @Column(name = "refund_status", nullable = false, length = 10)
  private RefundStatus refundStatus;

  @Column(name = "refund_destination", length = 60)
  private String refundDestination;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected OrderCancellation() {}

  public OrderCancellation(
      UUID orderId,
      String reason,
      String note,
      String itemsJson,
      BigDecimal valueCancelled,
      BigDecimal discountShare,
      BigDecimal grossPaid,
      BigDecimal feeRate,
      BigDecimal feeAmount,
      BigDecimal refundAmount,
      int pointsRestored,
      RefundMethod refundMethod,
      RefundStatus refundStatus,
      String refundDestination,
      Instant createdAt) {
    this.orderId = orderId;
    this.reason = reason;
    this.note = note;
    this.itemsJson = itemsJson;
    this.valueCancelled = valueCancelled;
    this.discountShare = discountShare;
    this.grossPaid = grossPaid;
    this.feeRate = feeRate;
    this.feeAmount = feeAmount;
    this.refundAmount = refundAmount;
    this.pointsRestored = pointsRestored;
    this.refundMethod = refundMethod;
    this.refundStatus = refundStatus;
    this.refundDestination = refundDestination;
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

  public UUID getOrderId() {
    return orderId;
  }

  public String getReason() {
    return reason;
  }

  public String getNote() {
    return note;
  }

  public String getItemsJson() {
    return itemsJson;
  }

  public BigDecimal getValueCancelled() {
    return valueCancelled;
  }

  public BigDecimal getDiscountShare() {
    return discountShare;
  }

  public BigDecimal getGrossPaid() {
    return grossPaid;
  }

  public BigDecimal getFeeRate() {
    return feeRate;
  }

  public BigDecimal getFeeAmount() {
    return feeAmount;
  }

  public BigDecimal getRefundAmount() {
    return refundAmount;
  }

  public int getPointsRestored() {
    return pointsRestored;
  }

  public RefundMethod getRefundMethod() {
    return refundMethod;
  }

  public RefundStatus getRefundStatus() {
    return refundStatus;
  }

  public String getRefundDestination() {
    return refundDestination;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
