package com.bookhaven.catalog.service;

import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bookhaven.catalog.dto.AuthorProfileDto;
import com.bookhaven.catalog.dto.AuthorSummaryDto;
import com.bookhaven.catalog.dto.BookDetail;
import com.bookhaven.catalog.dto.BookPage;
import com.bookhaven.catalog.dto.BookSummary;
import com.bookhaven.catalog.dto.BrandDto;
import com.bookhaven.catalog.dto.CategoryDto;
import com.bookhaven.catalog.entity.Book;
import com.bookhaven.catalog.entity.BookFormat;
import com.bookhaven.catalog.entity.Brand;
import com.bookhaven.catalog.entity.Category;
import com.bookhaven.catalog.entity.StockNotification;
import com.bookhaven.catalog.repository.AuthorRepository;
import com.bookhaven.catalog.repository.BookRepository;
import com.bookhaven.catalog.repository.BrandRepository;
import com.bookhaven.catalog.repository.CategoryRepository;
import com.bookhaven.catalog.repository.StockNotificationRepository;
import com.bookhaven.common.AppException;
import com.bookhaven.common.ErrorCode;
import com.bookhaven.common.MoneyUtil;
import com.bookhaven.member.repository.WishlistItemRepository;
import com.bookhaven.security.CurrentMember;
import com.bookhaven.shipping.service.DeliveryEstimator;

@Service
@Transactional(readOnly = true)
public class CatalogService {

  private static final int DEFAULT_PAGE_SIZE = 12;
  private static final int MAX_PAGE_SIZE = 48;

  private final BookRepository bookRepository;
  private final CategoryRepository categoryRepository;
  private final BrandRepository brandRepository;
  @SuppressWarnings("unused")
  private final AuthorRepository authorRepository;
  private final StockNotificationRepository stockNotificationRepository;
  private final DeliveryEstimator deliveryEstimator;
  private final WishlistItemRepository wishlistItemRepository;
  private final CurrentMember currentMember;

  public CatalogService(
      BookRepository bookRepository,
      CategoryRepository categoryRepository,
      BrandRepository brandRepository,
      AuthorRepository authorRepository,
      StockNotificationRepository stockNotificationRepository,
      DeliveryEstimator deliveryEstimator,
      WishlistItemRepository wishlistItemRepository,
      CurrentMember currentMember) {
    this.bookRepository = bookRepository;
    this.categoryRepository = categoryRepository;
    this.brandRepository = brandRepository;
    this.authorRepository = authorRepository;
    this.stockNotificationRepository = stockNotificationRepository;
    this.deliveryEstimator = deliveryEstimator;
    this.wishlistItemRepository = wishlistItemRepository;
    this.currentMember = currentMember;
  }

  public List<CategoryDto> listCategories() {
    return categoryRepository.findAllByOrderBySortOrderAsc().stream()
        .map(c -> new CategoryDto(c.getId(), c.getName(), c.getSlug()))
        .toList();
  }

  public List<BrandDto> listBrands() {
    return brandRepository.findAllByOrderByNameAsc().stream()
        .map(b -> new BrandDto(b.getId(), b.getName(), b.getSlug(), b.getLogoUrl()))
        .toList();
  }

  public BookPage listBooks(
      Integer page,
      Integer limit,
      String sort,
      String categorySlug,
      String brandSlug,
      String search,
      String language,
      BookFormat format,
      String price,
      String pincode) {

    Pageable pageable = createPageable(page, limit, sort);
    Specification<Book> spec = BookSpecifications.withFilters(
        categorySlug, brandSlug, search, language, format, price);

    Page<Book> bookPage = bookRepository.findAll(spec, pageable);
    List<BookSummary> items = bookPage.getContent().stream()
        .map(book -> toSummary(book, pincode))
        .toList();

    return new BookPage(
        items,
        bookPage.getTotalElements(),
        pageable.getPageNumber() + 1,
        pageable.getPageSize(),
        bookPage.getTotalPages());
  }

  public BookPage listCategoryBooks(
      String slug,
      Integer page,
      Integer limit,
      String sort,
      String search,
      String language,
      BookFormat format,
      String price,
      String pincode) {

    Category category = categoryRepository.findBySlug(slug)
        .orElseThrow(() -> AppException.notFound("Category not found: " + slug));

    return listBooks(page, limit, sort, category.getSlug(), null, search, language, format, price, pincode);
  }

  public BookPage listBrandBooks(
      String slug,
      Integer page,
      Integer limit,
      String sort,
      String categorySlug,
      String search,
      String language,
      BookFormat format,
      String price,
      String pincode) {

    Brand brand = brandRepository.findBySlug(slug)
        .orElseThrow(() -> AppException.notFound("Brand not found: " + slug));

    return listBooks(page, limit, sort, categorySlug, brand.getSlug(), search, language, format, price, pincode);
  }

  public BookDetail getBook(UUID id, String pincode, UUID currentMemberId) {
    Book book = bookRepository.findById(id)
        .orElseThrow(() -> AppException.notFound("Book not found: " + id));

    BookSummary summary = toSummary(book, pincode);

    String stockStatus;
    if (book.getFormat() == BookFormat.EBOOK || book.getFormat() == BookFormat.AUDIOBOOK) {
      stockStatus = "DIGITAL";
    } else if (book.getStockQuantity() == 0) {
      stockStatus = "OUT_OF_STOCK";
    } else if (book.getStockQuantity() <= 5) {
      stockStatus = "LOW_STOCK";
    } else {
      stockStatus = "IN_STOCK";
    }

    boolean notifyRequested = false;
    if (currentMemberId != null && stockStatus.equals("OUT_OF_STOCK")) {
      notifyRequested = stockNotificationRepository.existsByMemberIdAndBookId(currentMemberId, id);
    }

    BrandDto brandDto = new BrandDto(
        book.getBrand().getId(),
        book.getBrand().getName(),
        book.getBrand().getSlug(),
        book.getBrand().getLogoUrl());

    AuthorProfileDto writerDto = new AuthorProfileDto(
        book.getAuthor().getId(),
        book.getAuthor().getName(),
        book.getAuthor().getSlug(),
        book.getAuthor().getImageUrl(),
        false,
        book.getAuthor().getBio(),
        List.of());

    return new BookDetail(
        summary.id(),
        summary.slug(),
        summary.title(),
        summary.author(),
        summary.category(),
        summary.format(),
        summary.language(),
        summary.coverImageUrl(),
        summary.price(),
        summary.discountPercent(),
        summary.unitPrice(),
        summary.inStock(),
        summary.rating(),
        summary.reviewCount(),
        summary.deliveryDate(),
        summary.cartQuantity(),
        summary.inWishlist(),
        book.getDescription(),
        book.getIsbn(),
        brandDto,
        stockStatus,
        book.getBaseSoldCount(),
        writerDto,
        currentMemberId != null ? notifyRequested : null);
  }

  public List<BookSummary> relatedBooks(UUID id, String pincode) {
    Book book = bookRepository.findById(id)
        .orElseThrow(() -> AppException.notFound("Book not found: " + id));

    Set<Book> related = new LinkedHashSet<>();

    // Same author first, excluding current book
    Specification<Book> sameAuthor = (root, query, cb) ->
        cb.and(
            cb.equal(root.get("author").get("id"), book.getAuthor().getId()),
            cb.notEqual(root.get("id"), id));

    Page<Book> authorBooks = bookRepository.findAll(
        sameAuthor, PageRequest.of(0, 6, Sort.by(Sort.Direction.DESC, "baseSoldCount")));
    related.addAll(authorBooks.getContent());

    // Then same category if less than 6
    if (related.size() < 6) {
      Specification<Book> sameCategory = (root, query, cb) ->
          cb.and(
              cb.equal(root.get("category").get("id"), book.getCategory().getId()),
              cb.notEqual(root.get("id"), id));

      Page<Book> categoryBooks = bookRepository.findAll(
          sameCategory, PageRequest.of(0, 6, Sort.by(Sort.Direction.DESC, "baseSoldCount")));
      for (Book b : categoryBooks.getContent()) {
        if (related.size() >= 6) {
          break;
        }
        related.add(b);
      }
    }

    // Sort with in-stock first (FR-014a)
    return related.stream()
        .sorted((b1, b2) -> {
          boolean s1 = b1.getFormat() == BookFormat.EBOOK || b1.getFormat() == BookFormat.AUDIOBOOK || b1.getStockQuantity() > 0;
          boolean s2 = b2.getFormat() == BookFormat.EBOOK || b2.getFormat() == BookFormat.AUDIOBOOK || b2.getStockQuantity() > 0;
          return Boolean.compare(s2, s1);
        })
        .map(b -> toSummary(b, pincode))
        .toList();
  }

  @Transactional
  public void notifyMe(UUID memberId, UUID bookId) {
    Book book = bookRepository.findById(bookId)
        .orElseThrow(() -> AppException.notFound("Book not found: " + bookId));

    boolean isInStock = book.getFormat() == BookFormat.EBOOK ||
        book.getFormat() == BookFormat.AUDIOBOOK ||
        book.getStockQuantity() > 0;

    if (isInStock) {
      throw AppException.validation("bookId", "Book is already in stock", "RANGE");
    }

    if (stockNotificationRepository.existsByMemberIdAndBookId(memberId, bookId)) {
      throw new AppException(ErrorCode.ALREADY_NOTIFIED, "Notification already registered for this book");
    }

    stockNotificationRepository.save(new StockNotification(memberId, bookId));
  }

  public BookSummary toSummary(Book book, String pincode) {
    LocalDate deliveryDate = deliveryEstimator.estimateDeliveryDate(pincode, book.getFormat());
    boolean inStock = book.getFormat() == BookFormat.EBOOK ||
        book.getFormat() == BookFormat.AUDIOBOOK ||
        book.getStockQuantity() > 0;

    boolean inWishlist = currentMember.find()
        .map(memberId -> wishlistItemRepository.existsByMemberIdAndBookId(memberId, book.getId()))
        .orElse(false);

    return new BookSummary(
        book.getId(),
        book.getSlug(),
        book.getTitle(),
        new AuthorSummaryDto(book.getAuthor().getName(), book.getAuthor().getSlug()),
        new CategoryDto(book.getCategory().getId(), book.getCategory().getName(), book.getCategory().getSlug()),
        book.getFormat(),
        book.getLanguage(),
        book.getCoverImageUrl(),
        book.getPrice(),
        book.getDiscountPercent(),
        MoneyUtil.unitPrice(book.getPrice(), book.getDiscountPercent()),
        inStock,
        book.getRating(),
        book.getReviewCount(),
        deliveryDate,
        null,
        inWishlist,
        book.getDescription());
  }

  private Pageable createPageable(Integer page, Integer limit, String sortStr) {
    int pageNum = (page == null || page < 1) ? 0 : page - 1;
    int pageSize = (limit == null || limit < 1) ? DEFAULT_PAGE_SIZE : Math.min(limit, MAX_PAGE_SIZE);

    Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
    if (sortStr != null && !sortStr.isBlank()) {
      switch (sortStr.trim().toLowerCase()) {
        case "price_asc" -> sort = Sort.by(Sort.Direction.ASC, "price");
        case "price_desc" -> sort = Sort.by(Sort.Direction.DESC, "price");
        case "rating_desc" -> sort = Sort.by(Sort.Direction.DESC, "rating").and(Sort.by(Sort.Direction.DESC, "reviewCount"));
        case "bestselling" -> sort = Sort.by(Sort.Direction.DESC, "baseSoldCount");
        case "newest" -> sort = Sort.by(Sort.Direction.DESC, "createdAt");
        default -> {}
      }
    }

    return PageRequest.of(pageNum, pageSize, sort);
  }
}
