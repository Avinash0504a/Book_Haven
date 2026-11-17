package com.bookhaven.order.service;

import com.bookhaven.cart.service.CartService;
import com.bookhaven.catalog.entity.Book;
import com.bookhaven.catalog.entity.BookFormat;
import com.bookhaven.catalog.repository.BookRepository;
import com.bookhaven.common.AppException;
import com.bookhaven.order.dto.BuyAgainResult;
import com.bookhaven.order.dto.OrderDto;
import com.bookhaven.order.entity.Order;
import com.bookhaven.order.entity.OrderItem;
import com.bookhaven.order.entity.OrderStatus;
import com.bookhaven.order.repository.OrderItemRepository;
import com.bookhaven.order.repository.OrderRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class OrderService {

  private static final List<OrderStatus> EXCLUDED_STATUSES = List.of(OrderStatus.PENDING, OrderStatus.FAILED);

  private final OrderRepository orderRepository;
  private final OrderItemRepository orderItemRepository;
  private final BookRepository bookRepository;
  private final CartService cartService;
  private final CheckoutService checkoutService;

  public OrderService(
      OrderRepository orderRepository,
      OrderItemRepository orderItemRepository,
      BookRepository bookRepository,
      CartService cartService,
      CheckoutService checkoutService) {
    this.orderRepository = orderRepository;
    this.orderItemRepository = orderItemRepository;
    this.bookRepository = bookRepository;
    this.cartService = cartService;
    this.checkoutService = checkoutService;
  }

  @Transactional(readOnly = true)
  public List<OrderDto> listOrders(UUID memberId) {
    return orderRepository.findByMemberIdAndStatusNotInOrderByCreatedAtDesc(memberId, EXCLUDED_STATUSES)
        .stream()
        .map(checkoutService::toDto)
        .toList();
  }

  @Transactional(readOnly = true)
  public OrderDto getOrder(UUID memberId, UUID orderId) {
    Order order = orderRepository.findByIdAndMemberId(orderId, memberId)
        .orElseThrow(() -> AppException.notFound("Order not found: " + orderId));

    return checkoutService.toDto(order);
  }

  public BuyAgainResult buyAgain(UUID memberId, UUID orderId) {
    Order order = orderRepository.findByIdAndMemberId(orderId, memberId)
        .orElseThrow(() -> AppException.notFound("Order not found: " + orderId));

    List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
    List<String> added = new ArrayList<>();
    List<String> unavailable = new ArrayList<>();

    for (OrderItem item : items) {
      Optional<Book> bookOpt = bookRepository.findById(item.getBookId());
      if (bookOpt.isEmpty()) {
        unavailable.add(item.getTitleSnapshot());
        continue;
      }

      Book book = bookOpt.get();
      boolean isDigital = book.getFormat() == BookFormat.EBOOK || book.getFormat() == BookFormat.AUDIOBOOK;
      if (!isDigital && book.getStockQuantity() <= 0) {
        unavailable.add(item.getTitleSnapshot());
        continue;
      }

      try {
        cartService.addCartItem(memberId, book.getId(), item.getQuantity(), null);
        added.add(item.getTitleSnapshot());
      } catch (Exception e) {
        unavailable.add(item.getTitleSnapshot());
      }
    }

    return new BuyAgainResult(added, unavailable);
  }
}
