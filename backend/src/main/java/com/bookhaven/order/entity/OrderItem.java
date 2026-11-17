package com.bookhaven.order.entity;

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
@Table(name = "order_item")
public class OrderItem {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "order_id", nullable = false)
  private UUID orderId;

  @Column(name = "book_id", nullable = false)
  private UUID bookId;

  @Column(name = "title_snapshot", nullable = false, length = 200)
  private String titleSnapshot;

  @Column(name = "format_snapshot", nullable = false, length = 10)
  private String formatSnapshot;

  @Column(nullable = false)
  private int quantity;

  @Column(name = "cancelled_quantity", nullable = false)
  private int cancelledQuantity;

  @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
  private BigDecimal unitPrice;

  @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
  private BigDecimal lineTotal;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected OrderItem() {}

  public OrderItem(
      UUID orderId,
      UUID bookId,
      String titleSnapshot,
      String formatSnapshot,
      int quantity,
      BigDecimal unitPrice,
      BigDecimal lineTotal,
      Instant createdAt) {
    this.orderId = orderId;
    this.bookId = bookId;
    this.titleSnapshot = titleSnapshot;
    this.formatSnapshot = formatSnapshot;
    this.quantity = quantity;
    this.unitPrice = unitPrice;
    this.lineTotal = lineTotal;
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

  public UUID getBookId() {
    return bookId;
  }

  public String getTitleSnapshot() {
    return titleSnapshot;
  }

  public String getFormatSnapshot() {
    return formatSnapshot;
  }

  public int getQuantity() {
    return quantity;
  }

  public int getCancelledQuantity() {
    return cancelledQuantity;
  }

  public void setCancelledQuantity(int cancelledQuantity) {
    this.cancelledQuantity = cancelledQuantity;
  }

  public BigDecimal getUnitPrice() {
    return unitPrice;
  }

  public BigDecimal getLineTotal() {
    return lineTotal;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
