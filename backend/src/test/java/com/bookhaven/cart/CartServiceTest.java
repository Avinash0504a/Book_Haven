package com.bookhaven.cart;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bookhaven.cart.dto.CartDto;
import com.bookhaven.cart.entity.Cart;
import com.bookhaven.cart.entity.CartItem;
import com.bookhaven.cart.repository.CartItemRepository;
import com.bookhaven.cart.repository.CartRepository;
import com.bookhaven.cart.service.CartService;
import com.bookhaven.cart.service.PricingCalculator;
import com.bookhaven.catalog.dto.AuthorSummaryDto;
import com.bookhaven.catalog.dto.BookSummary;
import com.bookhaven.catalog.dto.CategoryDto;
import com.bookhaven.catalog.entity.Author;
import com.bookhaven.catalog.entity.Book;
import com.bookhaven.catalog.entity.BookFormat;
import com.bookhaven.catalog.entity.Category;
import com.bookhaven.catalog.repository.BookRepository;
import com.bookhaven.catalog.service.CatalogService;
import com.bookhaven.common.AppException;
import com.bookhaven.shipping.repository.AddressRepository;
import com.bookhaven.shipping.service.ShippingCalculator;
import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CartServiceTest {

  @Mock private CartRepository cartRepository;
  @Mock private CartItemRepository cartItemRepository;
  @Mock private BookRepository bookRepository;
  @Mock private AddressRepository addressRepository;
  @Mock private PricingCalculator pricingCalculator;
  @Mock private CatalogService catalogService;

  private CartService cartService;

  @BeforeEach
  void setUp() {
    cartService =
        new CartService(
            cartRepository,
            cartItemRepository,
            bookRepository,
            addressRepository,
            pricingCalculator,
            catalogService);

    when(pricingCalculator.freeShippingThreshold()).thenReturn(new BigDecimal("500.00"));
    when(pricingCalculator.calculateShipping(any(Boolean.class), any(BigDecimal.class)))
        .thenReturn(new ShippingCalculator.ShippingResult(new BigDecimal("0.00"), new BigDecimal("0.00")));
  }

  @Test
  void addCapsAtStockForPhysicalBook() {
    UUID memberId = UUID.randomUUID();
    UUID bookId = UUID.randomUUID();
    UUID cartId = UUID.randomUUID();

    Cart cart = new Cart(memberId, Instant.now());
    setField(cart, "id", cartId);
    when(cartRepository.findByMemberId(memberId)).thenReturn(Optional.of(cart));

    Book book = mock(Book.class);
    when(book.getId()).thenReturn(bookId);
    when(book.getFormat()).thenReturn(BookFormat.PAPERBACK);
    when(book.getStockQuantity()).thenReturn(3);
    when(book.getPrice()).thenReturn(new BigDecimal("299.00"));
    when(book.getDiscountPercent()).thenReturn(BigDecimal.ZERO);
    when(bookRepository.findById(bookId)).thenReturn(Optional.of(book));

    when(cartItemRepository.findByCartIdAndBookId(cartId, bookId)).thenReturn(Optional.empty());

    cartService.addCartItem(memberId, bookId, 5, "110001");

    ArgumentCaptor<CartItem> captor = ArgumentCaptor.forClass(CartItem.class);
    verify(cartItemRepository).save(captor.capture());
    assertThat(captor.getValue().getQuantity()).isEqualTo(3); // capped at stock 3
  }

  @Test
  void digitalIgnoresStock() {
    UUID memberId = UUID.randomUUID();
    UUID bookId = UUID.randomUUID();
    UUID cartId = UUID.randomUUID();

    Cart cart = new Cart(memberId, Instant.now());
    setField(cart, "id", cartId);
    when(cartRepository.findByMemberId(memberId)).thenReturn(Optional.of(cart));

    Book book = mock(Book.class);
    when(book.getId()).thenReturn(bookId);
    when(book.getFormat()).thenReturn(BookFormat.EBOOK);
    when(book.getStockQuantity()).thenReturn(0);
    when(book.getPrice()).thenReturn(new BigDecimal("199.00"));
    when(book.getDiscountPercent()).thenReturn(BigDecimal.ZERO);
    when(bookRepository.findById(bookId)).thenReturn(Optional.of(book));

    when(cartItemRepository.findByCartIdAndBookId(cartId, bookId)).thenReturn(Optional.empty());

    cartService.addCartItem(memberId, bookId, 4, "110001");

    ArgumentCaptor<CartItem> captor = ArgumentCaptor.forClass(CartItem.class);
    verify(cartItemRepository).save(captor.capture());
    assertThat(captor.getValue().getQuantity()).isEqualTo(4);
  }

  @Test
  void updateToZeroRemoves() {
    UUID memberId = UUID.randomUUID();
    UUID cartId = UUID.randomUUID();
    UUID itemId = UUID.randomUUID();

    Cart cart = new Cart(memberId, Instant.now());
    setField(cart, "id", cartId);
    when(cartRepository.findByMemberId(memberId)).thenReturn(Optional.of(cart));

    CartItem item = new CartItem(cartId, UUID.randomUUID(), 2, Instant.now());
    setField(item, "id", itemId);
    when(cartItemRepository.findByIdAndCartId(itemId, cartId)).thenReturn(Optional.of(item));

    cartService.updateCartItem(memberId, itemId, 0, "110001");

    verify(cartItemRepository).delete(item);
  }

  @Test
  void onlyOwnCartLoaded() {
    UUID memberId = UUID.randomUUID();
    UUID otherMemberCartId = UUID.randomUUID();
    UUID itemId = UUID.randomUUID();

    Cart cart = new Cart(memberId, Instant.now());
    setField(cart, "id", UUID.randomUUID());
    when(cartRepository.findByMemberId(memberId)).thenReturn(Optional.of(cart));

    // Trying to load item that belongs to other member's cart
    when(cartItemRepository.findByIdAndCartId(itemId, cart.getId())).thenReturn(Optional.empty());

    assertThatThrownBy(() -> cartService.updateCartItem(memberId, itemId, 3, "110001"))
        .isInstanceOf(AppException.class)
        .hasMessageContaining("Cart item not found");
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
