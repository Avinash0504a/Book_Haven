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
import java.time.LocalDate;
import java.util.UUID;

/** An order (table {@code orders}). The shipping address is a copied snapshot, not a reference. */
@Entity
@Table(name = "orders")
public class Order {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "member_id", nullable = false)
  private UUID memberId;

  @Column(name = "idempotency_key", nullable = false, length = 64)
  private String idempotencyKey;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private OrderStatus status;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal subtotal;

  @Column(name = "shipping_amount", nullable = false, precision = 12, scale = 2)
  private BigDecimal shippingAmount = BigDecimal.ZERO.setScale(2);

  @Column(name = "gift_points_used", nullable = false)
  private int giftPointsUsed;

  @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
  private BigDecimal discountAmount = BigDecimal.ZERO.setScale(2);

  /** The payable amount: {@code max(0, subtotal + shipping - discount)}. */
  @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
  private BigDecimal totalAmount;

  @Column(name = "points_earned", nullable = false)
  private int pointsEarned;

  @Column(name = "ship_recipient_name", length = 100)
  private String shipRecipientName;

  @Column(name = "ship_phone", length = 10)
  private String shipPhone;

  @Column(name = "ship_line1", length = 120)
  private String shipLine1;

  @Column(name = "ship_line2", length = 120)
  private String shipLine2;

  @Column(name = "ship_city", length = 80)
  private String shipCity;

  @Column(name = "ship_state", length = 80)
  private String shipState;

  @Column(name = "ship_postal_code", length = 6)
  private String shipPostalCode;

  @Column(name = "ship_country", length = 60)
  private String shipCountry;

  @Column(name = "delivery_date")
  private LocalDate deliveryDate;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "confirmed_at")
  private Instant confirmedAt;

  @Column(name = "packed_at")
  private Instant packedAt;

  @Column(name = "shipped_at")
  private Instant shippedAt;

  @Column(name = "delivered_at")
  private Instant deliveredAt;

  @Column(name = "cancelled_at")
  private Instant cancelledAt;

  /** {@code createdAt + 15 minutes} while the order is {@code PENDING}. */
  @Column(name = "expires_at")
  private Instant expiresAt;

  @Column(name = "cancellation_fee", nullable = false, precision = 12, scale = 2)
  private BigDecimal cancellationFee = BigDecimal.ZERO.setScale(2);

  @Column(name = "refund_amount", nullable = false, precision = 12, scale = 2)
  private BigDecimal refundAmount = BigDecimal.ZERO.setScale(2);

  protected Order() {}

  public Order(
      UUID memberId,
      String idempotencyKey,
      OrderStatus status,
      BigDecimal subtotal,
      BigDecimal shippingAmount,
      int giftPointsUsed,
      BigDecimal discountAmount,
      BigDecimal totalAmount,
      Instant createdAt) {
    this.memberId = memberId;
    this.idempotencyKey = idempotencyKey;
    this.status = status;
    this.subtotal = subtotal;
    this.shippingAmount = shippingAmount;
    this.giftPointsUsed = giftPointsUsed;
    this.discountAmount = discountAmount;
    this.totalAmount = totalAmount;
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

  public String getIdempotencyKey() {
    return idempotencyKey;
  }

  public OrderStatus getStatus() {
    return status;
  }

  public void setStatus(OrderStatus status) {
    this.status = status;
  }

  public BigDecimal getSubtotal() {
    return subtotal;
  }

  public BigDecimal getShippingAmount() {
    return shippingAmount;
  }

  public int getGiftPointsUsed() {
    return giftPointsUsed;
  }

  public BigDecimal getDiscountAmount() {
    return discountAmount;
  }

  public BigDecimal getTotalAmount() {
    return totalAmount;
  }

  public int getPointsEarned() {
    return pointsEarned;
  }

  public void setPointsEarned(int pointsEarned) {
    this.pointsEarned = pointsEarned;
  }

  public String getShipRecipientName() {
    return shipRecipientName;
  }

  public String getShipPhone() {
    return shipPhone;
  }

  public String getShipLine1() {
    return shipLine1;
  }

  public String getShipLine2() {
    return shipLine2;
  }

  public String getShipCity() {
    return shipCity;
  }

  public String getShipState() {
    return shipState;
  }

  public String getShipPostalCode() {
    return shipPostalCode;
  }

  public String getShipCountry() {
    return shipCountry;
  }

  /** Copies the address fields so later edits or deletes never alter this order. */
  public void snapshotAddress(
      String recipientName,
      String phone,
      String line1,
      String line2,
      String city,
      String state,
      String postalCode,
      String country) {
    this.shipRecipientName = recipientName;
    this.shipPhone = phone;
    this.shipLine1 = line1;
    this.shipLine2 = line2;
    this.shipCity = city;
    this.shipState = state;
    this.shipPostalCode = postalCode;
    this.shipCountry = country;
  }

  public LocalDate getDeliveryDate() {
    return deliveryDate;
  }

  public void setDeliveryDate(LocalDate deliveryDate) {
    this.deliveryDate = deliveryDate;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getConfirmedAt() {
    return confirmedAt;
  }

  public void setConfirmedAt(Instant confirmedAt) {
    this.confirmedAt = confirmedAt;
  }

  public Instant getPackedAt() {
    return packedAt;
  }

  public void setPackedAt(Instant packedAt) {
    this.packedAt = packedAt;
  }

  public Instant getShippedAt() {
    return shippedAt;
  }

  public void setShippedAt(Instant shippedAt) {
    this.shippedAt = shippedAt;
  }

  public Instant getDeliveredAt() {
    return deliveredAt;
  }

  public void setDeliveredAt(Instant deliveredAt) {
    this.deliveredAt = deliveredAt;
  }

  public Instant getCancelledAt() {
    return cancelledAt;
  }

  public void setCancelledAt(Instant cancelledAt) {
    this.cancelledAt = cancelledAt;
  }

  public Instant getExpiresAt() {
    return expiresAt;
  }

  public void setExpiresAt(Instant expiresAt) {
    this.expiresAt = expiresAt;
  }

  public BigDecimal getCancellationFee() {
    return cancellationFee;
  }

  public void setCancellationFee(BigDecimal cancellationFee) {
    this.cancellationFee = cancellationFee;
  }

  public BigDecimal getRefundAmount() {
    return refundAmount;
  }

  public void setRefundAmount(BigDecimal refundAmount) {
    this.refundAmount = refundAmount;
  }
}
