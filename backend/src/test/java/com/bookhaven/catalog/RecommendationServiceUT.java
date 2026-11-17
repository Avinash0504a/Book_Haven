package com.bookhaven.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.bookhaven.catalog.dto.AuthorSummaryDto;
import com.bookhaven.catalog.dto.BookSummary;
import com.bookhaven.catalog.dto.CategoryDto;
import com.bookhaven.catalog.entity.Author;
import com.bookhaven.catalog.entity.Book;
import com.bookhaven.catalog.entity.BookFormat;
import com.bookhaven.catalog.entity.Category;
import com.bookhaven.catalog.repository.BookRepository;
import com.bookhaven.catalog.service.CatalogService;
import com.bookhaven.catalog.service.RecommendationService;
import com.bookhaven.member.entity.WishlistItem;
import com.bookhaven.member.repository.WishlistItemRepository;
import com.bookhaven.order.entity.Order;
import com.bookhaven.order.entity.OrderItem;
import com.bookhaven.order.entity.OrderStatus;
import com.bookhaven.order.repository.OrderItemRepository;
import com.bookhaven.order.repository.OrderRepository;
import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RecommendationServiceUT {

  @Mock private BookRepository bookRepository;
  @Mock private OrderRepository orderRepository;
  @Mock private OrderItemRepository orderItemRepository;
  @Mock private WishlistItemRepository wishlistItemRepository;
  @Mock private CatalogService catalogService;

  private RecommendationService recommendationService;

  @BeforeEach
  void setUp() {
    recommendationService =
        new RecommendationService(
            bookRepository,
            orderRepository,
            orderItemRepository,
            wishlistItemRepository,
            catalogService);
  }

  @Test
  void guestGetsTopSellers() {
    Book b1 = createBook(UUID.randomUUID(), "Book 1", 100, 10);
    Book b2 = createBook(UUID.randomUUID(), "Book 2", 80, 5);

    when(bookRepository.findAll(any(Specification.class), any(Pageable.class)))
        .thenReturn(new PageImpl<>(List.of(b1, b2)));
    when(catalogService.toSummary(any(Book.class), any())).thenAnswer(inv -> {
      Book b = inv.getArgument(0);
      return dummySummary(b.getId(), b.getTitle());
    });

    List<BookSummary> results = recommendationService.getRecommendations(null, "110001");
    assertThat(results).hasSize(2);
    assertThat(results.get(0).title()).isEqualTo("Book 1");
  }

  @Test
  void excludesAlreadyBought() {
    UUID memberId = UUID.randomUUID();
    UUID boughtBookId = UUID.randomUUID();
    UUID recBookId = UUID.randomUUID();

    Order order = new Order(memberId, "key1", OrderStatus.CONFIRMED, BigDecimal.TEN, BigDecimal.ZERO, 0, BigDecimal.ZERO, BigDecimal.TEN, Instant.now());
    setField(order, "id", UUID.randomUUID());
    OrderItem item = new OrderItem(order.getId(), boughtBookId, "Bought Book", "PAPERBACK", 1, BigDecimal.TEN, BigDecimal.TEN, Instant.now());

    when(orderRepository.findByMemberIdAndStatusIn(eq(memberId), any())).thenReturn(List.of(order));
    when(orderItemRepository.findByOrderIdIn(any())).thenReturn(List.of(item));

    Book boughtBook = createBook(boughtBookId, "Bought Book", 50, 10);
    when(bookRepository.findAllById(any())).thenReturn(List.of(boughtBook));
    when(wishlistItemRepository.findByMemberIdOrderByCreatedAtDesc(memberId)).thenReturn(List.of());

    Book recBook = createBook(recBookId, "Recommended Book", 90, 5);
    when(bookRepository.findAll(any(Specification.class), any(Pageable.class)))
        .thenReturn(new PageImpl<>(List.of(recBook)));

    when(catalogService.toSummary(any(Book.class), any())).thenAnswer(inv -> {
      Book b = inv.getArgument(0);
      return dummySummary(b.getId(), b.getTitle());
    });

    List<BookSummary> results = recommendationService.getRecommendations(memberId, "110001");
    assertThat(results).hasSize(1);
    assertThat(results.get(0).id()).isEqualTo(recBookId);
  }

  @Test
  void limitSix() {
    List<Book> books = List.of(
        createBook(UUID.randomUUID(), "B1", 100, 10),
        createBook(UUID.randomUUID(), "B2", 90, 10),
        createBook(UUID.randomUUID(), "B3", 80, 10),
        createBook(UUID.randomUUID(), "B4", 70, 10),
        createBook(UUID.randomUUID(), "B5", 60, 10),
        createBook(UUID.randomUUID(), "B6", 50, 10),
        createBook(UUID.randomUUID(), "B7", 40, 10));

    when(bookRepository.findAll(any(Specification.class), any(Pageable.class)))
        .thenReturn(new PageImpl<>(books));
    when(catalogService.toSummary(any(Book.class), any())).thenAnswer(inv -> {
      Book b = inv.getArgument(0);
      return dummySummary(b.getId(), b.getTitle());
    });

    List<BookSummary> results = recommendationService.getRecommendations(null, "110001");
    assertThat(results).hasSize(6);
  }

  private Book createBook(UUID id, String title, int soldCount, int stock) {
    Book book = mock(Book.class);
    lenient().when(book.getId()).thenReturn(id);
    lenient().when(book.getTitle()).thenReturn(title);
    lenient().when(book.getFormat()).thenReturn(BookFormat.PAPERBACK);
    lenient().when(book.getStockQuantity()).thenReturn(stock);
    lenient().when(book.getBaseSoldCount()).thenReturn(soldCount);
    Author author = mock(Author.class);
    lenient().when(author.getId()).thenReturn(UUID.randomUUID());
    lenient().when(book.getAuthor()).thenReturn(author);
    Category category = mock(Category.class);
    lenient().when(category.getId()).thenReturn(UUID.randomUUID());
    lenient().when(book.getCategory()).thenReturn(category);
    return book;
  }

  private BookSummary dummySummary(UUID id, String title) {
    return new BookSummary(
        id,
        "slug",
        title,
        new AuthorSummaryDto("Author", "author"),
        new CategoryDto(UUID.randomUUID(), "Cat", "cat"),
        BookFormat.PAPERBACK,
        "English",
        "/covers/cover.svg",
        new BigDecimal("499.00"),
        BigDecimal.ZERO,
        new BigDecimal("499.00"),
        true,
        new BigDecimal("4.5"),
        10,
        LocalDate.now().plusDays(3),
        null,
        null,
        "A short description.");
  }

  private void setField(Object target, String fieldName, Object value) {
    try {
      Field f = target.getClass().getDeclaredField(fieldName);
      f.setAccessible(true);
      f.set(target, value);
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }
}
