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
@Table(name = "author_follow")
public class AuthorFollow {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "member_id", nullable = false)
  private UUID memberId;

  @Column(name = "author_id", nullable = false)
  private UUID authorId;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected AuthorFollow() {}

  public AuthorFollow(UUID memberId, UUID authorId) {
    this(memberId, authorId, Instant.now());
  }

  public AuthorFollow(UUID memberId, UUID authorId, Instant createdAt) {
    this.memberId = memberId;
    this.authorId = authorId;
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

  public UUID getAuthorId() {
    return authorId;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
