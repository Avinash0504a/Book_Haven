package com.bookhaven.catalog.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** A writer. The UI says "Writer"; the code says {@code Author}. */
@Entity
@Table(name = "author")
public class Author {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false, length = 100)
  private String name;

  @Column(nullable = false, length = 100)
  private String slug;

  private String bio;

  @Column(name = "image_url", length = 300)
  private String imageUrl;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected Author() {}

  public UUID getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public String getSlug() {
    return slug;
  }

  public String getBio() {
    return bio;
  }

  public String getImageUrl() {
    return imageUrl;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
