package com.bookhaven.catalog.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * A book. Derived values (unit price, in-stock, delivery date, sold count) are computed by the
 * service layer and never stored here.
 */
@Entity
@Table(name = "book")
public class Book {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false, length = 200)
  private String title;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "author_id")
  private Author author;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "category_id")
  private Category category;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "brand_id")
  private Brand brand;

  private String description;

  @Column(length = 20)
  private String isbn;

  /** List price, greater than zero. */
  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal price;

  @Column(name = "discount_percent", nullable = false, precision = 5, scale = 2)
  private BigDecimal discountPercent;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private BookFormat format;

  @Column(nullable = false, length = 20)
  private String language;

  /** Ignored for digital formats. */
  @Column(name = "stock_quantity", nullable = false)
  private int stockQuantity;

  @Column(name = "cover_image_url", length = 300)
  private String coverImageUrl;

  @Column(nullable = false, length = 120)
  private String slug;

  @Column(nullable = false, precision = 2, scale = 1)
  private BigDecimal rating;

  @Column(name = "review_count", nullable = false)
  private int reviewCount;

  @Column(name = "base_sold_count", nullable = false)
  private int baseSoldCount;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected Book() {}

  public UUID getId() {
    return id;
  }

  public String getTitle() {
    return title;
  }

  public Author getAuthor() {
    return author;
  }

  public Category getCategory() {
    return category;
  }

  public Brand getBrand() {
    return brand;
  }

  public String getDescription() {
    return description;
  }

  public String getIsbn() {
    return isbn;
  }

  public BigDecimal getPrice() {
    return price;
  }

  public BigDecimal getDiscountPercent() {
    return discountPercent;
  }

  public BookFormat getFormat() {
    return format;
  }

  public String getLanguage() {
    return language;
  }

  public int getStockQuantity() {
    return stockQuantity;
  }

  public void setStockQuantity(int stockQuantity) {
    this.stockQuantity = stockQuantity;
  }

  public String getCoverImageUrl() {
    return coverImageUrl;
  }

  public String getSlug() {
    return slug;
  }

  public BigDecimal getRating() {
    return rating;
  }

  public int getReviewCount() {
    return reviewCount;
  }

  public void setRating(BigDecimal rating) {
    this.rating = rating;
  }

  public void setReviewCount(int reviewCount) {
    this.reviewCount = reviewCount;
  }

  public int getBaseSoldCount() {
    return baseSoldCount;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
