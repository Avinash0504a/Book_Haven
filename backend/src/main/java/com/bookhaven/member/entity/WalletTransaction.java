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
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "wallet_transaction")
public class WalletTransaction {

  public enum Source {
    TOPUP,
    ORDER_PAYMENT,
    ORDER_REFUND
  }

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "member_id", nullable = false)
  private UUID memberId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 6)
  private WalletTxnType type;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal amount;

  @Column(length = 200)
  private String description;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private Source source;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected WalletTransaction() {}

  public WalletTransaction(
      UUID memberId,
      WalletTxnType type,
      BigDecimal amount,
      String description,
      Source source,
      Instant createdAt) {
    this.memberId = memberId;
    this.type = type;
    this.amount = amount;
    this.description = description;
    this.source = source;
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

  public WalletTxnType getType() {
    return type;
  }

  public BigDecimal getAmount() {
    return amount;
  }

  public String getDescription() {
    return description;
  }

  public Source getSource() {
    return source;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
