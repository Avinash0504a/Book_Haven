package com.bookhaven.catalog.entity;

public enum BookFormat {
  PAPERBACK,
  HARDCOVER,
  EBOOK,
  AUDIOBOOK;

  public boolean isPhysical() {
    return this == PAPERBACK || this == HARDCOVER;
  }

  public boolean isDigital() {
    return !isPhysical();
  }
}
