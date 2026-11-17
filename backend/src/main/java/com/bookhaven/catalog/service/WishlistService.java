package com.bookhaven.catalog.service;

import com.bookhaven.catalog.dto.BookSummary;
import com.bookhaven.catalog.entity.Book;
import com.bookhaven.catalog.repository.BookRepository;
import com.bookhaven.common.AppException;
import com.bookhaven.member.entity.WishlistItem;
import com.bookhaven.member.repository.WishlistItemRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class WishlistService {

  private final WishlistItemRepository wishlistItemRepository;
  private final BookRepository bookRepository;
  private final CatalogService catalogService;

  public WishlistService(
      WishlistItemRepository wishlistItemRepository,
      BookRepository bookRepository,
      CatalogService catalogService) {
    this.wishlistItemRepository = wishlistItemRepository;
    this.bookRepository = bookRepository;
    this.catalogService = catalogService;
  }

  @Transactional(readOnly = true)
  public List<BookSummary> listWishlist(UUID memberId, String pincode) {
    List<WishlistItem> items = wishlistItemRepository.findByMemberIdOrderByCreatedAtDesc(memberId);
    return items.stream()
        .map(item -> bookRepository.findById(item.getBookId()))
        .filter(java.util.Optional::isPresent)
        .map(java.util.Optional::get)
        .map(book -> {
          BookSummary s = catalogService.toSummary(book, pincode);
          return new BookSummary(
              s.id(),
              s.slug(),
              s.title(),
              s.author(),
              s.category(),
              s.format(),
              s.language(),
              s.coverImageUrl(),
              s.price(),
              s.discountPercent(),
              s.unitPrice(),
              s.inStock(),
              s.rating(),
              s.reviewCount(),
              s.deliveryDate(),
              s.cartQuantity(),
              true,
              s.description());
        })
        .toList();
  }

  public void addWishlistItem(UUID memberId, UUID bookId) {
    if (!bookRepository.existsById(bookId)) {
      throw AppException.notFound("Book not found: " + bookId);
    }

    if (!wishlistItemRepository.existsByMemberIdAndBookId(memberId, bookId)) {
      wishlistItemRepository.save(new WishlistItem(memberId, bookId));
    }
  }

  public void removeWishlistItem(UUID memberId, UUID bookId) {
    WishlistItem item = wishlistItemRepository.findByMemberIdAndBookId(memberId, bookId)
        .orElseThrow(() -> AppException.notFound("Wishlist item not found for book: " + bookId));
    wishlistItemRepository.delete(item);
  }
}
