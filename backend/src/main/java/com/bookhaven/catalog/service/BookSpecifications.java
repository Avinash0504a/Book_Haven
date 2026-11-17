package com.bookhaven.catalog.service;

import com.bookhaven.catalog.entity.Book;
import com.bookhaven.catalog.entity.BookFormat;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

public final class BookSpecifications {

  private BookSpecifications() {}

  public static Specification<Book> withFilters(
      String categorySlug,
      String brandSlug,
      String search,
      String language,
      BookFormat format,
      String priceBand) {

    return (root, query, cb) -> {
      List<Predicate> predicates = new ArrayList<>();

      if (categorySlug != null && !categorySlug.isBlank()) {
        predicates.add(cb.equal(root.get("category").get("slug"), categorySlug));
      }

      if (brandSlug != null && !brandSlug.isBlank()) {
        predicates.add(cb.equal(root.get("brand").get("slug"), brandSlug));
      }

      if (language != null && !language.isBlank()) {
        predicates.add(cb.equal(root.get("language"), language));
      }

      if (format != null) {
        predicates.add(cb.equal(root.get("format"), format));
      }

      if (search != null && !search.isBlank()) {
        String pattern = "%" + search.trim().toLowerCase() + "%";
        Predicate titleMatch = cb.like(cb.lower(root.get("title")), pattern);
        Predicate descMatch = cb.like(cb.lower(root.get("description")), pattern);
        Predicate authorMatch = cb.like(cb.lower(root.get("author").get("name")), pattern);
        predicates.add(cb.or(titleMatch, descMatch, authorMatch));
      }

      if (priceBand != null && !priceBand.isBlank()) {
        // Effective price = price * (1 - discountPercent / 100)
        Expression<Number> factor = cb.diff(cb.literal(BigDecimal.ONE), cb.quot(root.get("discountPercent"), cb.literal(new BigDecimal("100"))));
        Expression<BigDecimal> effectivePrice = cb.prod(root.get("price"), factor.as(BigDecimal.class));

        switch (priceBand.toLowerCase().trim()) {
          case "under-300" -> predicates.add(cb.lessThan(effectivePrice, new BigDecimal("300.00")));
          case "300-600" -> predicates.add(
              cb.and(
                  cb.greaterThanOrEqualTo(effectivePrice, new BigDecimal("300.00")),
                  cb.lessThanOrEqualTo(effectivePrice, new BigDecimal("600.00"))));
          case "600-1000" -> predicates.add(
              cb.and(
                  cb.greaterThanOrEqualTo(effectivePrice, new BigDecimal("600.00")),
                  cb.lessThanOrEqualTo(effectivePrice, new BigDecimal("1000.00"))));
          case "above-1000" -> predicates.add(cb.greaterThan(effectivePrice, new BigDecimal("1000.00")));
          default -> {}
        }
      }

      return predicates.isEmpty() ? cb.conjunction() : cb.and(predicates.toArray(new Predicate[0]));
    };
  }
}
