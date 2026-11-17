package com.bookhaven.catalog.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "brand")
public class Brand {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false, length = 100)
  private String name;

  @Column(nullable = false, length = 100)
  private String slug;

  @Column(name = "logo_url", length = 300)
  private String logoUrl;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected Brand() {}

  public UUID getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public String getSlug() {
    return slug;
  }

  public String getLogoUrl() {
    return logoUrl;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
