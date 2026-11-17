package com.bookhaven.payment.entity;

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

/**
 * A payment record. Card numbers, CVV, UPI ids and bank choices beyond the method name are never
 * stored.
 */
@Entity
@Table(name = "payment")
public class Payment {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "order_id", nullable = false)
  private UUID orderId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 12)
  private PaymentMethod method;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private PaymentStatus status;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal amount;

  @Column(length = 40)
  private String reference;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected Payment() {}

  public Payment(
      UUID orderId,
      PaymentMethod method,
      PaymentStatus status,
      BigDecimal amount,
      String reference,
      Instant createdAt) {
    this.orderId = orderId;
    this.method = method;
    this.status = status;
    this.amount = amount;
    this.reference = reference;
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

  public PaymentMethod getMethod() {
    return method;
  }

  public PaymentStatus getStatus() {
    return status;
  }

  public void setStatus(PaymentStatus status) {
    this.status = status;
  }

  public BigDecimal getAmount() {
    return amount;
  }

  public String getReference() {
    return reference;
  }

  public void setReference(String reference) {
    this.reference = reference;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
