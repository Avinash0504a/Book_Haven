package com.bookhaven.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bookhaven.catalog.entity.Book;
import com.bookhaven.catalog.entity.BookFormat;
import com.bookhaven.catalog.entity.StockNotification;
import com.bookhaven.catalog.repository.AuthorRepository;
import com.bookhaven.catalog.repository.BookRepository;
import com.bookhaven.catalog.repository.BrandRepository;
import com.bookhaven.catalog.repository.CategoryRepository;
import com.bookhaven.catalog.repository.StockNotificationRepository;
import com.bookhaven.catalog.service.CatalogService;
import com.bookhaven.common.AppException;
import com.bookhaven.common.ErrorCode;
import com.bookhaven.member.repository.WishlistItemRepository;
import com.bookhaven.security.CurrentMember;
import com.bookhaven.shipping.service.DeliveryEstimator;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class StockNotificationServiceTest {

  @Mock private BookRepository bookRepository;
  @Mock private CategoryRepository categoryRepository;
  @Mock private BrandRepository brandRepository;
  @Mock private AuthorRepository authorRepository;
  @Mock private StockNotificationRepository stockNotificationRepository;
  @Mock private DeliveryEstimator deliveryEstimator;
  @Mock private WishlistItemRepository wishlistItemRepository;
  @Mock private CurrentMember currentMember;

  private CatalogService catalogService;

  @BeforeEach
  void setUp() {
    catalogService =
        new CatalogService(
            bookRepository,
            categoryRepository,
            brandRepository,
            authorRepository,
            stockNotificationRepository,
            deliveryEstimator,
            wishlistItemRepository,
            currentMember);
  }

  @Test
  void rejectsInStockBook() {
    UUID memberId = UUID.randomUUID();
    UUID bookId = UUID.randomUUID();

    Book inStockBook = mock(Book.class);
    when(inStockBook.getFormat()).thenReturn(BookFormat.PAPERBACK);
    when(inStockBook.getStockQuantity()).thenReturn(5);
    when(bookRepository.findById(bookId)).thenReturn(Optional.of(inStockBook));

    assertThatThrownBy(() -> catalogService.notifyMe(memberId, bookId))
        .isInstanceOf(AppException.class)
        .hasMessageContaining("Validation failed");
  }

  @Test
  void rejectsDuplicate() {
    UUID memberId = UUID.randomUUID();
    UUID bookId = UUID.randomUUID();

    Book outOfStockBook = mock(Book.class);
    when(outOfStockBook.getFormat()).thenReturn(BookFormat.PAPERBACK);
    when(outOfStockBook.getStockQuantity()).thenReturn(0);
    when(bookRepository.findById(bookId)).thenReturn(Optional.of(outOfStockBook));
    when(stockNotificationRepository.existsByMemberIdAndBookId(memberId, bookId)).thenReturn(true);

    assertThatThrownBy(() -> catalogService.notifyMe(memberId, bookId))
        .isInstanceOf(AppException.class)
        .matches(e -> ((AppException) e).code() == ErrorCode.ALREADY_NOTIFIED);
  }

  @Test
  void savesOnce() {
    UUID memberId = UUID.randomUUID();
    UUID bookId = UUID.randomUUID();

    Book outOfStockBook = mock(Book.class);
    when(outOfStockBook.getFormat()).thenReturn(BookFormat.PAPERBACK);
    when(outOfStockBook.getStockQuantity()).thenReturn(0);
    when(bookRepository.findById(bookId)).thenReturn(Optional.of(outOfStockBook));
    when(stockNotificationRepository.existsByMemberIdAndBookId(memberId, bookId)).thenReturn(false);

    catalogService.notifyMe(memberId, bookId);

    ArgumentCaptor<StockNotification> captor = ArgumentCaptor.forClass(StockNotification.class);
    verify(stockNotificationRepository).save(captor.capture());
    assertThat(captor.getValue().getMemberId()).isEqualTo(memberId);
    assertThat(captor.getValue().getBookId()).isEqualTo(bookId);
  }
}
