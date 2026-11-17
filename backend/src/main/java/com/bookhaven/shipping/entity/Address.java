package com.bookhaven.shipping.entity;

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

/** A delivery address with soft delete: {@code deletedAt} hides it but past orders keep a snapshot. */
@Entity
@Table(name = "address")
public class Address {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "member_id", nullable = false)
  private UUID memberId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private AddressLabel label;

  @Column(name = "recipient_name", nullable = false, length = 100)
  private String recipientName;

  @Column(nullable = false, length = 10)
  private String phone;

  @Column(nullable = false, length = 120)
  private String line1;

  @Column(length = 120)
  private String line2;

  @Column(nullable = false, length = 80)
  private String city;

  @Column(nullable = false, length = 80)
  private String state;

  @Column(name = "postal_code", nullable = false, length = 6)
  private String postalCode;

  @Column(nullable = false, length = 60)
  private String country = "India";

  @Column(name = "is_default", nullable = false)
  private boolean isDefault;

  @Column(name = "deleted_at")
  private Instant deletedAt;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected Address() {}

  public Address(
      UUID memberId,
      AddressLabel label,
      String recipientName,
      String phone,
      String line1,
      String line2,
      String city,
      String state,
      String postalCode,
      String country,
      boolean isDefault,
      Instant createdAt) {
    this.memberId = memberId;
    this.label = label;
    this.recipientName = recipientName;
    this.phone = phone;
    this.line1 = line1;
    this.line2 = line2;
    this.city = city;
    this.state = state;
    this.postalCode = postalCode;
    this.country = country == null || country.isBlank() ? "India" : country;
    this.isDefault = isDefault;
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

  public AddressLabel getLabel() {
    return label;
  }

  public void setLabel(AddressLabel label) {
    this.label = label;
  }

  public String getRecipientName() {
    return recipientName;
  }

  public void setRecipientName(String recipientName) {
    this.recipientName = recipientName;
  }

  public String getPhone() {
    return phone;
  }

  public void setPhone(String phone) {
    this.phone = phone;
  }

  public String getLine1() {
    return line1;
  }

  public void setLine1(String line1) {
    this.line1 = line1;
  }

  public String getLine2() {
    return line2;
  }

  public void setLine2(String line2) {
    this.line2 = line2;
  }

  public String getCity() {
    return city;
  }

  public void setCity(String city) {
    this.city = city;
  }

  public String getState() {
    return state;
  }

  public void setState(String state) {
    this.state = state;
  }

  public String getPostalCode() {
    return postalCode;
  }

  public void setPostalCode(String postalCode) {
    this.postalCode = postalCode;
  }

  public String getCountry() {
    return country;
  }

  public void setCountry(String country) {
    this.country = country;
  }

  public boolean isDefault() {
    return isDefault;
  }

  public void setDefault(boolean isDefault) {
    this.isDefault = isDefault;
  }

  public Instant getDeletedAt() {
    return deletedAt;
  }

  public void setDeletedAt(Instant deletedAt) {
    this.deletedAt = deletedAt;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
