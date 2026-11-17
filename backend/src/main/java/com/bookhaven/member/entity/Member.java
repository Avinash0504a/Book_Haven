package com.bookhaven.member.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "member")
public class Member {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "full_name", nullable = false, length = 100)
  private String fullName;

  @Column(nullable = false, length = 254)
  private String email;

  /** BCrypt hash. Never serialised and never returned by any endpoint. */
  @JsonIgnore
  @Column(name = "password_hash", nullable = false, length = 100)
  private String passwordHash;

  @Column(name = "gift_points", nullable = false)
  private int giftPoints;

  @Column(name = "wallet_balance", nullable = false, precision = 12, scale = 2)
  private BigDecimal walletBalance = BigDecimal.ZERO.setScale(2);

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected Member() {}

  public Member(String fullName, String email, String passwordHash, Instant createdAt) {
    this.fullName = fullName;
    this.email = email;
    this.passwordHash = passwordHash;
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

  public String getFullName() {
    return fullName;
  }

  public void setFullName(String fullName) {
    this.fullName = fullName;
  }

  public String getEmail() {
    return email;
  }

  @JsonIgnore
  public String getPasswordHash() {
    return passwordHash;
  }

  public int getGiftPoints() {
    return giftPoints;
  }

  public void setGiftPoints(int giftPoints) {
    this.giftPoints = giftPoints;
  }

  public BigDecimal getWalletBalance() {
    return walletBalance;
  }

  public void setWalletBalance(BigDecimal walletBalance) {
    this.walletBalance = walletBalance;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
