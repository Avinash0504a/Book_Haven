package com.bookhaven.cart.service;

import com.bookhaven.cart.dto.CartDto;
import com.bookhaven.cart.dto.CartItemDto;
import com.bookhaven.cart.entity.Cart;
import com.bookhaven.cart.entity.CartItem;
import com.bookhaven.cart.repository.CartItemRepository;
import com.bookhaven.cart.repository.CartRepository;
import com.bookhaven.catalog.dto.BookSummary;
import com.bookhaven.catalog.entity.Book;
import com.bookhaven.catalog.entity.BookFormat;
import com.bookhaven.catalog.repository.BookRepository;
import com.bookhaven.catalog.service.CatalogService;
import com.bookhaven.common.AppException;
import com.bookhaven.common.MoneyUtil;
import com.bookhaven.shipping.entity.Address;
import com.bookhaven.shipping.repository.AddressRepository;
import com.bookhaven.shipping.service.ShippingCalculator;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CartService {

  private static final int MAX_ITEM_QUANTITY = 10;

  private final CartRepository cartRepository;
  private final CartItemRepository cartItemRepository;
  private final BookRepository bookRepository;
  private final AddressRepository addressRepository;
  private final PricingCalculator pricingCalculator;
  private final CatalogService catalogService;

  public CartService(
      CartRepository cartRepository,
      CartItemRepository cartItemRepository,
      BookRepository bookRepository,
      AddressRepository addressRepository,
      PricingCalculator pricingCalculator,
      CatalogService catalogService) {
    this.cartRepository = cartRepository;
    this.cartItemRepository = cartItemRepository;
    this.bookRepository = bookRepository;
    this.addressRepository = addressRepository;
    this.pricingCalculator = pricingCalculator;
    this.catalogService = catalogService;
  }

  @Transactional(readOnly = true)
  public CartDto getCart(UUID memberId, String pincode) {
    Cart cart = getOrCreateCart(memberId);
    List<CartItem> items = cartItemRepository.findByCartIdOrderByCreatedAtAsc(cart.getId());

    List<CartItemDto> itemDtos = new ArrayList<>();
    BigDecimal subtotal = BigDecimal.ZERO.setScale(2);
    BigDecimal physicalSubtotal = BigDecimal.ZERO.setScale(2);
    boolean hasPhysical = false;
    boolean hasDigital = false;
    int itemCount = 0;

    for (CartItem item : items) {
      Book book = bookRepository.findById(item.getBookId())
          .orElseThrow(() -> AppException.notFound("Book not found: " + item.getBookId()));

      boolean isDigital = book.getFormat() == BookFormat.EBOOK || book.getFormat() == BookFormat.AUDIOBOOK;
      if (isDigital) {
        hasDigital = true;
      } else {
        hasPhysical = true;
      }

      int maxQty = isDigital ? MAX_ITEM_QUANTITY : Math.min(MAX_ITEM_QUANTITY, book.getStockQuantity());
      BigDecimal unitPrice = pricingCalculator.unitPrice(book.getPrice(), book.getDiscountPercent());
      BigDecimal lineTotal = pricingCalculator.lineTotal(unitPrice, item.getQuantity());

      subtotal = subtotal.add(lineTotal);
      if (!isDigital) {
        physicalSubtotal = physicalSubtotal.add(lineTotal);
      }
      itemCount += item.getQuantity();

      BookSummary summary = catalogService.toSummary(book, pincode);
      itemDtos.add(new CartItemDto(item.getId(), summary, item.getQuantity(), maxQty, lineTotal));
    }

    ShippingCalculator.ShippingResult shippingResult =
        pricingCalculator.calculateShipping(hasPhysical, physicalSubtotal);

    BigDecimal shippingAmount = shippingResult.shippingAmount();
    BigDecimal freeShippingRemaining = shippingResult.freeShippingRemaining();
    BigDecimal total = MoneyUtil.round(subtotal.add(shippingAmount));
    int pointsToEarn = pricingCalculator.calculatePointsToEarn(total);

    UUID defaultAddressId = addressRepository
        .findByMemberIdAndIsDefaultTrueAndDeletedAtIsNull(memberId)
        .map(Address::getId)
        .orElse(null);

    return new CartDto(
        itemDtos,
        itemCount,
        hasPhysical,
        hasDigital,
        subtotal,
        shippingAmount,
        pricingCalculator.freeShippingThreshold(),
        freeShippingRemaining,
        total,
        pointsToEarn,
        defaultAddressId);
  }

  public CartDto addCartItem(UUID memberId, UUID bookId, int quantity, String pincode) {
    if (quantity < 1 || quantity > MAX_ITEM_QUANTITY) {
      throw AppException.validation("quantity", "Quantity must be between 1 and 10", "RANGE");
    }

    Book book = bookRepository.findById(bookId)
        .orElseThrow(() -> AppException.notFound("Book not found: " + bookId));

    boolean isDigital = book.getFormat() == BookFormat.EBOOK || book.getFormat() == BookFormat.AUDIOBOOK;
    if (!isDigital && book.getStockQuantity() <= 0) {
      throw AppException.validation("quantity", "Book is out of stock", "RANGE");
    }

    Cart cart = getOrCreateCart(memberId);
    Optional<CartItem> existingItem = cartItemRepository.findByCartIdAndBookId(cart.getId(), bookId);

    if (existingItem.isPresent()) {
      CartItem item = existingItem.get();
      int newQuantity = item.getQuantity() + quantity;
      if (newQuantity > MAX_ITEM_QUANTITY) {
        newQuantity = MAX_ITEM_QUANTITY;
      }
      if (!isDigital && newQuantity > book.getStockQuantity()) {
        newQuantity = Math.max(item.getQuantity(), book.getStockQuantity());
      }
      item.setQuantity(newQuantity);
      cartItemRepository.save(item);
    } else {
      int initialQuantity = quantity;
      if (!isDigital && initialQuantity > book.getStockQuantity()) {
        initialQuantity = book.getStockQuantity();
      }
      CartItem newItem = new CartItem(cart.getId(), bookId, initialQuantity, Instant.now());
      cartItemRepository.save(newItem);
    }

    return getCart(memberId, pincode);
  }

  public CartDto updateCartItem(UUID memberId, UUID itemId, int quantity, String pincode) {
    if (quantity < 0 || quantity > MAX_ITEM_QUANTITY) {
      throw AppException.validation("quantity", "Quantity must be between 0 and 10", "RANGE");
    }

    Cart cart = getOrCreateCart(memberId);
    CartItem item = cartItemRepository.findByIdAndCartId(itemId, cart.getId())
        .orElseThrow(() -> AppException.notFound("Cart item not found: " + itemId));

    if (quantity == 0) {
      cartItemRepository.delete(item);
    } else {
      Book book = bookRepository.findById(item.getBookId())
          .orElseThrow(() -> AppException.notFound("Book not found: " + item.getBookId()));

      boolean isDigital = book.getFormat() == BookFormat.EBOOK || book.getFormat() == BookFormat.AUDIOBOOK;
      int targetQuantity = quantity;
      if (!isDigital && targetQuantity > book.getStockQuantity()) {
        targetQuantity = book.getStockQuantity();
      }
      item.setQuantity(targetQuantity);
      cartItemRepository.save(item);
    }

    return getCart(memberId, pincode);
  }

  public CartDto removeCartItem(UUID memberId, UUID itemId, String pincode) {
    Cart cart = getOrCreateCart(memberId);
    CartItem item = cartItemRepository.findByIdAndCartId(itemId, cart.getId())
        .orElseThrow(() -> AppException.notFound("Cart item not found: " + itemId));

    cartItemRepository.delete(item);
    return getCart(memberId, pincode);
  }

  public void clearCart(UUID memberId) {
    Cart cart = getOrCreateCart(memberId);
    cartItemRepository.deleteByCartId(cart.getId());
  }

  public Cart getOrCreateCart(UUID memberId) {
    return cartRepository.findByMemberId(memberId)
        .orElseGet(() -> cartRepository.save(new Cart(memberId, Instant.now())));
  }
}
