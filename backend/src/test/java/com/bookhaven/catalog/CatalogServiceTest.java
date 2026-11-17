package com.bookhaven.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bookhaven.catalog.dto.BookPage;
import com.bookhaven.catalog.dto.CategoryDto;
import com.bookhaven.catalog.entity.Author;
import com.bookhaven.catalog.entity.Book;
import com.bookhaven.catalog.entity.BookFormat;
import com.bookhaven.catalog.entity.Brand;
import com.bookhaven.catalog.entity.Category;
import com.bookhaven.catalog.repository.AuthorRepository;
import com.bookhaven.catalog.repository.BookRepository;
import com.bookhaven.catalog.repository.BrandRepository;
import com.bookhaven.catalog.repository.CategoryRepository;
import com.bookhaven.catalog.repository.StockNotificationRepository;
import com.bookhaven.catalog.service.CatalogService;
import com.bookhaven.common.AppException;
import com.bookhaven.member.repository.WishlistItemRepository;
import com.bookhaven.security.CurrentMember;
import com.bookhaven.shipping.service.DeliveryEstimator;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
class CatalogServiceTest {

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
  void capsPageSizeAt48() {
    when(bookRepository.findAll(any(Specification.class), any(Pageable.class)))
        .thenReturn(Page.empty());

    catalogService.listBooks(1, 100, "newest", null, null, null, null, null, null, "110001");

    ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
    verify(bookRepository).findAll(any(Specification.class), captor.capture());
    assertThat(captor.getValue().getPageSize()).isEqualTo(48);
  }

  @Test
  void passesFiltersToSpecification() {
    when(bookRepository.findAll(any(Specification.class), any(Pageable.class)))
        .thenReturn(Page.empty());

    catalogService.listBooks(
        2, 10, "price_asc", "fiction", "penguin", "potter", "English", BookFormat.PAPERBACK, "under-300", "110001");

    ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
    verify(bookRepository).findAll(any(Specification.class), captor.capture());
    assertThat(captor.getValue().getPageNumber()).isEqualTo(1); // 0-based page index for page 2
    assertThat(captor.getValue().getPageSize()).isEqualTo(10);
  }

  @Test
  void unknownCategoryThrowsNotFound() {
    when(categoryRepository.findBySlug("unknown")).thenReturn(Optional.empty());

    assertThatThrownBy(
            () ->
                catalogService.listCategoryBooks(
                    "unknown", 1, 12, null, null, null, null, null, "110001"))
        .isInstanceOf(AppException.class)
        .hasMessageContaining("Category not found: unknown");
  }

  @Test
  void unknownBrandThrowsNotFound() {
    when(brandRepository.findBySlug("unknown")).thenReturn(Optional.empty());

    assertThatThrownBy(
            () ->
                catalogService.listBrandBooks(
                    "unknown", 1, 12, null, null, null, null, null, null, "110001"))
        .isInstanceOf(AppException.class)
        .hasMessageContaining("Brand not found: unknown");
  }
}
