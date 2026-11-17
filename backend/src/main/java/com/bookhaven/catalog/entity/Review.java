package com.bookhaven.catalog.entity;

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
@Table(name = "review")
public class Review {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "member_id", nullable = false)
  private UUID memberId;

  @Column(name = "book_id", nullable = false)
  private UUID bookId;

  @Column(nullable = false)
  private int rating;

  @Column(nullable = false, length = 100)
  private String body;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected Review() {}

  public Review(UUID memberId, UUID bookId, int rating, String body) {
    this(memberId, bookId, rating, body, Instant.now());
  }

  public Review(UUID memberId, UUID bookId, int rating, String body, Instant createdAt) {
    this.memberId = memberId;
    this.bookId = bookId;
    this.rating = rating;
    this.body = body;
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

  public int getRating() {
    return rating;
  }

  public String getBody() {
    return body;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
