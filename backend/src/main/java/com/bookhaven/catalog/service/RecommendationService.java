package com.bookhaven.catalog.service;

import com.bookhaven.catalog.dto.BookSummary;
import com.bookhaven.catalog.entity.Book;
import com.bookhaven.catalog.entity.BookFormat;
import com.bookhaven.catalog.repository.BookRepository;
import com.bookhaven.member.entity.WishlistItem;
import com.bookhaven.member.repository.WishlistItemRepository;
import com.bookhaven.order.entity.Order;
import com.bookhaven.order.entity.OrderItem;
import com.bookhaven.order.entity.OrderStatus;
import com.bookhaven.order.repository.OrderItemRepository;
import com.bookhaven.order.repository.OrderRepository;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class RecommendationService {

  private static final int RECOMMENDATION_LIMIT = 6;
  private static final List<OrderStatus> CONFIRMED_STATUSES = List.of(
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED);

  private final BookRepository bookRepository;
  private final OrderRepository orderRepository;
  private final OrderItemRepository orderItemRepository;
  private final WishlistItemRepository wishlistItemRepository;
  private final CatalogService catalogService;

  public RecommendationService(
      BookRepository bookRepository,
      OrderRepository orderRepository,
      OrderItemRepository orderItemRepository,
      WishlistItemRepository wishlistItemRepository,
      CatalogService catalogService) {
    this.bookRepository = bookRepository;
    this.orderRepository = orderRepository;
    this.orderItemRepository = orderItemRepository;
    this.wishlistItemRepository = wishlistItemRepository;
    this.catalogService = catalogService;
  }

  public List<BookSummary> getRecommendations(UUID memberId, String pincode) {
    Set<Book> candidateBooks = new LinkedHashSet<>();
    Set<UUID> boughtBookIds = new HashSet<>();

    if (memberId != null) {
      List<Order> orders = orderRepository.findByMemberIdAndStatusIn(memberId, CONFIRMED_STATUSES);
      List<UUID> orderIds = orders.stream().map(Order::getId).toList();
      List<OrderItem> orderItems = orderIds.isEmpty()
          ? List.of()
          : orderItemRepository.findByOrderIdIn(orderIds);

      for (OrderItem item : orderItems) {
        boughtBookIds.add(item.getBookId());
      }

      Set<UUID> interestAuthorIds = new HashSet<>();
      Set<UUID> interestCategoryIds = new HashSet<>();

      if (!boughtBookIds.isEmpty()) {
        List<Book> boughtBooks = bookRepository.findAllById(boughtBookIds);
        for (Book b : boughtBooks) {
          interestAuthorIds.add(b.getAuthor().getId());
          interestCategoryIds.add(b.getCategory().getId());
        }
      }

      List<WishlistItem> wishlistItems = wishlistItemRepository.findByMemberIdOrderByCreatedAtDesc(memberId);
      Set<UUID> wishlistBookIds = new HashSet<>();
      for (WishlistItem w : wishlistItems) {
        wishlistBookIds.add(w.getBookId());
      }

      if (!wishlistBookIds.isEmpty()) {
        List<Book> wishlistBooks = bookRepository.findAllById(wishlistBookIds);
        for (Book b : wishlistBooks) {
          interestAuthorIds.add(b.getAuthor().getId());
          interestCategoryIds.add(b.getCategory().getId());
        }
      }

      if (!interestAuthorIds.isEmpty() || !interestCategoryIds.isEmpty()) {
        Specification<Book> spec = (root, query, cb) -> {
          List<jakarta.persistence.criteria.Predicate> orPredicates = new ArrayList<>();
          if (!interestAuthorIds.isEmpty()) {
            orPredicates.add(root.get("author").get("id").in(interestAuthorIds));
          }
          if (!interestCategoryIds.isEmpty()) {
            orPredicates.add(root.get("category").get("id").in(interestCategoryIds));
          }
          jakarta.persistence.criteria.Predicate matchInterest = cb.or(orPredicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
          if (!boughtBookIds.isEmpty()) {
            return cb.and(matchInterest, cb.not(root.get("id").in(boughtBookIds)));
          }
          return matchInterest;
        };

        Page<Book> matched = bookRepository.findAll(
            spec, PageRequest.of(0, RECOMMENDATION_LIMIT, Sort.by(Sort.Direction.DESC, "baseSoldCount")));
        candidateBooks.addAll(matched.getContent());
      }
    }

    // Fallback to top sellers if less than 6
    if (candidateBooks.size() < RECOMMENDATION_LIMIT) {
      Specification<Book> topSellerSpec = (root, query, cb) -> {
        if (!boughtBookIds.isEmpty()) {
          return cb.not(root.get("id").in(boughtBookIds));
        }
        return cb.conjunction();
      };

      Page<Book> topSellers = bookRepository.findAll(
          topSellerSpec, PageRequest.of(0, RECOMMENDATION_LIMIT * 2, Sort.by(Sort.Direction.DESC, "baseSoldCount")));

      for (Book b : topSellers.getContent()) {
        if (candidateBooks.size() >= RECOMMENDATION_LIMIT) {
          break;
        }
        candidateBooks.add(b);
      }
    }

    // Out-of-stock books last
    return candidateBooks.stream()
        .limit(RECOMMENDATION_LIMIT)
        .sorted((b1, b2) -> {
          boolean s1 = b1.getFormat() == BookFormat.EBOOK || b1.getFormat() == BookFormat.AUDIOBOOK || b1.getStockQuantity() > 0;
          boolean s2 = b2.getFormat() == BookFormat.EBOOK || b2.getFormat() == BookFormat.AUDIOBOOK || b2.getStockQuantity() > 0;
          return Boolean.compare(s2, s1);
        })
        .map(b -> catalogService.toSummary(b, pincode))
        .toList();
  }
}
