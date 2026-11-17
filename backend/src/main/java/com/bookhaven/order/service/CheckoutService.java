package com.bookhaven.order.service;

import com.bookhaven.cart.dto.CartDto;
import com.bookhaven.cart.dto.CartItemDto;
import com.bookhaven.cart.service.CartService;
import com.bookhaven.cart.service.PricingCalculator;
import com.bookhaven.catalog.entity.Book;
import com.bookhaven.catalog.entity.BookFormat;
import com.bookhaven.catalog.repository.BookRepository;
import com.bookhaven.common.AppException;
import com.bookhaven.common.ErrorCode;
import com.bookhaven.common.MoneyUtil;
import com.bookhaven.config.AppProperties;
import com.bookhaven.member.entity.GiftPointsTransaction;
import com.bookhaven.member.entity.Member;
import com.bookhaven.member.repository.GiftPointsTransactionRepository;
import com.bookhaven.member.repository.MemberRepository;
import com.bookhaven.order.dto.ApplyPointsRequest;
import com.bookhaven.order.dto.ApplyPointsResult;
import com.bookhaven.order.dto.CancellationDto;
import com.bookhaven.order.dto.ConfirmPaymentRequest;
import com.bookhaven.order.dto.CreateOrderRequest;
import com.bookhaven.order.dto.FailPaymentRequest;
import com.bookhaven.order.dto.OrderDto;
import com.bookhaven.order.dto.OrderItemDto;
import com.bookhaven.order.dto.OrderPaymentDto;
import com.bookhaven.order.entity.Order;
import com.bookhaven.order.entity.OrderCancellation;
import com.bookhaven.order.entity.OrderItem;
import com.bookhaven.order.entity.OrderStatus;
import com.bookhaven.order.repository.OrderCancellationRepository;
import com.bookhaven.order.repository.OrderItemRepository;
import com.bookhaven.order.repository.OrderRepository;
import com.bookhaven.payment.dto.BankDto;
import com.bookhaven.payment.entity.Payment;
import com.bookhaven.payment.entity.PaymentMethod;
import com.bookhaven.payment.entity.PaymentStatus;
import com.bookhaven.payment.repository.PaymentRepository;
import com.bookhaven.payment.service.PaymentDetailsValidator;
import com.bookhaven.payment.service.SimulatedGateway;
import com.bookhaven.payment.service.WalletService;
import com.bookhaven.shipping.dto.AddressDto;
import com.bookhaven.shipping.entity.Address;
import com.bookhaven.shipping.repository.AddressRepository;
import com.bookhaven.shipping.service.DeliveryEstimator;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CheckoutService {

  private static final ZoneId KOLKATA_ZONE = ZoneId.of("Asia/Kolkata");
  private static final Duration CANCEL_WINDOW = Duration.ofHours(48);

  private final OrderRepository orderRepository;
  private final OrderItemRepository orderItemRepository;
  private final OrderCancellationRepository orderCancellationRepository;
  private final PaymentRepository paymentRepository;
  private final MemberRepository memberRepository;
  private final GiftPointsTransactionRepository giftPointsTransactionRepository;
  private final AddressRepository addressRepository;
  private final BookRepository bookRepository;
  private final CartService cartService;
  private final PricingCalculator pricingCalculator;
  private final PaymentDetailsValidator paymentDetailsValidator;
  private final SimulatedGateway simulatedGateway;
  private final WalletService walletService;
  private final DeliveryEstimator deliveryEstimator;
  private final AppProperties appProperties;
  private final Clock clock;

  public CheckoutService(
      OrderRepository orderRepository,
      OrderItemRepository orderItemRepository,
      OrderCancellationRepository orderCancellationRepository,
      PaymentRepository paymentRepository,
      MemberRepository memberRepository,
      GiftPointsTransactionRepository giftPointsTransactionRepository,
      AddressRepository addressRepository,
      BookRepository bookRepository,
      CartService cartService,
      PricingCalculator pricingCalculator,
      PaymentDetailsValidator paymentDetailsValidator,
      SimulatedGateway simulatedGateway,
      WalletService walletService,
      DeliveryEstimator deliveryEstimator,
      AppProperties appProperties,
      Clock clock) {
    this.orderRepository = orderRepository;
    this.orderItemRepository = orderItemRepository;
    this.orderCancellationRepository = orderCancellationRepository;
    this.paymentRepository = paymentRepository;
    this.memberRepository = memberRepository;
    this.giftPointsTransactionRepository = giftPointsTransactionRepository;
    this.addressRepository = addressRepository;
    this.bookRepository = bookRepository;
    this.cartService = cartService;
    this.pricingCalculator = pricingCalculator;
    this.paymentDetailsValidator = paymentDetailsValidator;
    this.simulatedGateway = simulatedGateway;
    this.walletService = walletService;
    this.deliveryEstimator = deliveryEstimator;
    this.appProperties = appProperties;
    this.clock = clock;
  }

  @Transactional(readOnly = true)
  public CartDto validateCheckout(UUID memberId, String pincode) {
    CartDto cart = cartService.getCart(memberId, pincode);
    if (cart.items().isEmpty()) {
      throw new AppException(ErrorCode.EMPTY_CART, "Cart is empty");
    }

    for (CartItemDto item : cart.items()) {
      Book book = bookRepository.findById(item.book().id())
          .orElseThrow(() -> AppException.notFound("Book not found: " + item.book().id()));
      boolean isDigital = book.getFormat() == BookFormat.EBOOK || book.getFormat() == BookFormat.AUDIOBOOK;
      if (!isDigital && book.getStockQuantity() < item.quantity()) {
        throw new AppException(ErrorCode.INSUFFICIENT_STOCK, "Insufficient stock for: " + book.getTitle());
      }
    }

    return cart;
  }

  public List<BankDto> listBanks() {
    return paymentDetailsValidator.getSupportedBanks();
  }

  @Transactional(readOnly = true)
  public ApplyPointsResult applyPoints(UUID memberId, ApplyPointsRequest request) {
    Member member = memberRepository.findById(memberId)
        .orElseThrow(() -> AppException.notFound("Member not found: " + memberId));

    if (request.points() > member.getGiftPoints()) {
      throw AppException.validation("points", "Points requested exceed your balance", "INSUFFICIENT_POINTS");
    }

    CartDto cart = cartService.getCart(memberId, null);
    if (cart.items().isEmpty()) {
      throw new AppException(ErrorCode.EMPTY_CART, "Cart is empty");
    }

    BigDecimal subtotalAndShipping = cart.subtotal().add(cart.shippingAmount());
    var calc = pricingCalculator.calculatePoints(subtotalAndShipping, request.points(), member.getGiftPoints());

    return new ApplyPointsResult(
        calc.pointsUsed(),
        calc.discountAmount(),
        calc.payableAmount(),
        calc.pointsEarned());
  }

  public OrderDto createOrder(UUID memberId, String idempotencyKey, CreateOrderRequest request) {
    if (idempotencyKey == null || idempotencyKey.trim().length() < 8) {
      throw AppException.validation("Idempotency-Key", "Idempotency-Key header is required (at least 8 characters)", "REQUIRED");
    }

    // Check duplicate idempotency key
    Optional<Order> existing = orderRepository.findByIdempotencyKeyAndMemberId(idempotencyKey.trim(), memberId);
    if (existing.isPresent()) {
      return toDto(existing.get());
    }

    CartDto cart = cartService.getCart(memberId, null);
    if (cart.items().isEmpty()) {
      throw new AppException(ErrorCode.EMPTY_CART, "Cart is empty");
    }

    Address address = null;
    LocalDate deliveryDate = null;
    if (cart.hasPhysical()) {
      if (request.addressId() == null) {
        throw AppException.validation("addressId", "Delivery address is required for physical books", "ADDRESS_REQUIRED");
      }
      address = addressRepository.findByIdAndMemberIdAndDeletedAtIsNull(request.addressId(), memberId)
          .orElseThrow(() -> AppException.notFound("Address not found: " + request.addressId()));
      deliveryDate = deliveryEstimator.estimateDeliveryDate(address.getPostalCode(), BookFormat.PAPERBACK);
    }

    if (request.paymentMethod() == PaymentMethod.COD && cart.hasDigital()) {
      throw AppException.validation("paymentMethod", "Cash on Delivery is not available for digital items", "COD_NOT_AVAILABLE");
    }

    Member member = memberRepository.findByIdForUpdate(memberId)
        .orElseThrow(() -> AppException.notFound("Member not found: " + memberId));

    if (request.giftPointsToUse() > member.getGiftPoints()) {
      throw AppException.validation("giftPointsToUse", "Requested points exceed your balance", "INSUFFICIENT_POINTS");
    }

    BigDecimal subtotalAndShipping = cart.subtotal().add(cart.shippingAmount());
    var pointsCalc = pricingCalculator.calculatePoints(subtotalAndShipping, request.giftPointsToUse(), member.getGiftPoints());

    if (request.paymentMethod() == PaymentMethod.COD && pointsCalc.payableAmount().compareTo(new BigDecimal("50000.00")) > 0) {
      throw AppException.validation("paymentMethod", "COD is only available for orders up to 50,000 rupees", "RANGE");
    }

    // Reserve stock atomically
    for (CartItemDto item : cart.items()) {
      Book book = bookRepository.findById(item.book().id())
          .orElseThrow(() -> AppException.notFound("Book not found: " + item.book().id()));
      boolean isDigital = book.getFormat() == BookFormat.EBOOK || book.getFormat() == BookFormat.AUDIOBOOK;
      if (!isDigital) {
        int updated = bookRepository.decrementStockIfAvailable(book.getId(), item.quantity());
        if (updated == 0) {
          throw new AppException(ErrorCode.INSUFFICIENT_STOCK, "Insufficient stock for " + book.getTitle());
        }
      }
    }

    Instant now = Instant.now(clock);

    // Create Order in PENDING status
    Order order = new Order(
        memberId,
        idempotencyKey.trim(),
        OrderStatus.PENDING,
        cart.subtotal(),
        cart.shippingAmount(),
        pointsCalc.pointsUsed(),
        pointsCalc.discountAmount(),
        pointsCalc.payableAmount(),
        now);

    int expiryMins = appProperties.orders().expiryMinutes();
    order.setExpiresAt(now.plus(Duration.ofMinutes(expiryMins > 0 ? expiryMins : 15)));
    order.setDeliveryDate(deliveryDate);

    if (address != null) {
      order.snapshotAddress(
          address.getRecipientName(),
          address.getPhone(),
          address.getLine1(),
          address.getLine2(),
          address.getCity(),
          address.getState(),
          address.getPostalCode(),
          address.getCountry());
    }

    Order savedOrder = orderRepository.save(order);

    // Save OrderItems
    for (CartItemDto item : cart.items()) {
      Book book = bookRepository.findById(item.book().id()).orElseThrow();
      OrderItem orderItem = new OrderItem(
          savedOrder.getId(),
          book.getId(),
          book.getTitle(),
          book.getFormat().name(),
          item.quantity(),
          item.book().unitPrice(),
          item.lineTotal(),
          now);
      orderItemRepository.save(orderItem);
    }

    // Deduct points
    if (pointsCalc.pointsUsed() > 0) {
      member.setGiftPoints(member.getGiftPoints() - pointsCalc.pointsUsed());
      memberRepository.save(member);
      giftPointsTransactionRepository.save(new GiftPointsTransaction(
          memberId, savedOrder.getId(), -pointsCalc.pointsUsed(), GiftPointsTransaction.Reason.REDEEMED, now));
    }

    // Create Payment record in PENDING status
    Payment payment = new Payment(
        savedOrder.getId(),
        request.paymentMethod(),
        PaymentStatus.PENDING,
        savedOrder.getTotalAmount(),
        null,
        now);
    paymentRepository.save(payment);

    return toDto(savedOrder);
  }

  public OrderDto confirmPayment(UUID memberId, ConfirmPaymentRequest request) {
    Order order = orderRepository.findByIdAndMemberId(request.orderId(), memberId)
        .orElseThrow(() -> AppException.notFound("Order not found: " + request.orderId()));

    if (order.getStatus() != OrderStatus.PENDING) {
      if (order.getStatus() == OrderStatus.CONFIRMED ||
          order.getStatus() == OrderStatus.PROCESSING ||
          order.getStatus() == OrderStatus.SHIPPED ||
          order.getStatus() == OrderStatus.DELIVERED) {
        return toDto(order); // Idempotent
      }
      throw new AppException(ErrorCode.ORDER_EXPIRED, "Order is no longer pending");
    }

    Instant now = Instant.now(clock);
    if (order.getExpiresAt() != null && now.isAfter(order.getExpiresAt())) {
      order.setStatus(OrderStatus.FAILED);
      orderRepository.save(order);
      throw new AppException(ErrorCode.ORDER_EXPIRED, "Order has expired");
    }

    Payment payment = paymentRepository.findByOrderId(order.getId())
        .orElseThrow(() -> AppException.notFound("Payment record not found"));

    if (payment.getMethod() == PaymentMethod.WALLET) {
      walletService.debitForOrder(memberId, order.getTotalAmount(), order.getId());
      payment.setStatus(PaymentStatus.SUCCESS);
      payment.setReference("WALLET-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
    } else if (payment.getMethod() == PaymentMethod.COD) {
      payment.setStatus(PaymentStatus.PENDING);
      payment.setReference("COD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
    } else {
      paymentDetailsValidator.validate(payment.getMethod(), request.payment());
      String ref = simulatedGateway.processPayment(payment.getMethod(), request.payment());
      payment.setStatus(PaymentStatus.SUCCESS);
      payment.setReference(ref);
    }
    paymentRepository.save(payment);

    // Award gift points: floor(payable / 10)
    int pointsEarned = pricingCalculator.calculatePointsToEarn(order.getTotalAmount());
    if (pointsEarned > 0) {
      Member member = memberRepository.findByIdForUpdate(memberId).orElseThrow();
      member.setGiftPoints(member.getGiftPoints() + pointsEarned);
      memberRepository.save(member);
      giftPointsTransactionRepository.save(new GiftPointsTransaction(
          memberId, order.getId(), pointsEarned, GiftPointsTransaction.Reason.EARNED, now));
    }
    order.setPointsEarned(pointsEarned);
    order.setConfirmedAt(now);

    // Check if digital-only
    List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
    boolean hasPhysical = items.stream().anyMatch(i -> {
      BookFormat f = BookFormat.valueOf(i.getFormatSnapshot());
      return f == BookFormat.PAPERBACK || f == BookFormat.HARDCOVER;
    });

    if (!hasPhysical) {
      order.setStatus(OrderStatus.DELIVERED);
      order.setDeliveredAt(now);
    } else {
      order.setStatus(OrderStatus.CONFIRMED);
    }

    Order saved = orderRepository.save(order);
    cartService.clearCart(memberId);

    return toDto(saved);
  }

  public OrderDto failPayment(UUID memberId, FailPaymentRequest request) {
    Order order = orderRepository.findByIdAndMemberId(request.orderId(), memberId)
        .orElseThrow(() -> AppException.notFound("Order not found: " + request.orderId()));

    if (order.getStatus() == OrderStatus.PENDING) {
      order.setStatus(OrderStatus.FAILED);
      Instant now = Instant.now(clock);

      // Restore stock
      List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
      for (OrderItem item : items) {
        BookFormat f = BookFormat.valueOf(item.getFormatSnapshot());
        if (f == BookFormat.PAPERBACK || f == BookFormat.HARDCOVER) {
          bookRepository.incrementStock(item.getBookId(), item.getQuantity());
        }
      }

      // Restore redeemed points
      if (order.getGiftPointsUsed() > 0) {
        Member member = memberRepository.findByIdForUpdate(memberId).orElseThrow();
        member.setGiftPoints(member.getGiftPoints() + order.getGiftPointsUsed());
        memberRepository.save(member);
        giftPointsTransactionRepository.save(new GiftPointsTransaction(
            memberId, order.getId(), order.getGiftPointsUsed(), GiftPointsTransaction.Reason.RESTORED_ON_FAILURE, now));
      }

      Payment payment = paymentRepository.findByOrderId(order.getId()).orElse(null);
      if (payment != null) {
        payment.setStatus(PaymentStatus.FAILED);
        paymentRepository.save(payment);
      }

      orderRepository.save(order);
    }

    return toDto(order);
  }

  public OrderDto toDto(Order order) {
    List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
    Instant now = Instant.now(clock);
    Instant cancelEndsAt = order.getCreatedAt().plus(CANCEL_WINDOW);
    boolean insideWindow = now.isBefore(cancelEndsAt);

    boolean statusEligible = order.getStatus() == OrderStatus.CONFIRMED ||
        order.getStatus() == OrderStatus.PROCESSING ||
        order.getStatus() == OrderStatus.SHIPPED;

    String blockedReason = null;
    if (!insideWindow) {
      blockedReason = "Cancellation window (48 hours) has expired";
    } else if (order.getStatus() == OrderStatus.DELIVERED) {
      blockedReason = "Delivered orders cannot be cancelled";
    } else if (order.getStatus() == OrderStatus.CANCELLED) {
      blockedReason = "Order is already cancelled";
    } else if (order.getStatus() == OrderStatus.PENDING || order.getStatus() == OrderStatus.FAILED) {
      blockedReason = "Order cannot be cancelled in this status";
    }

    boolean hasCancellableItems = items.stream().anyMatch(i -> {
      BookFormat f = BookFormat.valueOf(i.getFormatSnapshot());
      boolean isPhysical = f == BookFormat.PAPERBACK || f == BookFormat.HARDCOVER;
      return isPhysical && (i.getQuantity() - i.getCancelledQuantity() > 0);
    });

    if (insideWindow && statusEligible && !hasCancellableItems) {
      blockedReason = "No cancellable items remaining";
    }

    boolean isCancellable = insideWindow && statusEligible && hasCancellableItems;

    List<OrderItemDto> itemDtos = items.stream().map(i -> {
      BookFormat format = BookFormat.valueOf(i.getFormatSnapshot());
      boolean isPhysical = format == BookFormat.PAPERBACK || format == BookFormat.HARDCOVER;
      boolean itemCancellable = isCancellable && isPhysical && (i.getQuantity() - i.getCancelledQuantity() > 0);

      Book book = bookRepository.findById(i.getBookId()).orElse(null);
      String coverUrl = book != null ? book.getCoverImageUrl() : null;
      String authorName = book != null ? book.getAuthor().getName() : "";

      return new OrderItemDto(
          i.getId(),
          i.getBookId(),
          i.getTitleSnapshot(),
          authorName,
          format,
          coverUrl,
          i.getQuantity(),
          i.getCancelledQuantity(),
          i.getUnitPrice(),
          i.getLineTotal(),
          itemCancellable);
    }).toList();

    AddressDto addressDto = null;
    if (order.getShipRecipientName() != null) {
      addressDto = new AddressDto(
          null,
          null,
          order.getShipRecipientName(),
          order.getShipPhone(),
          order.getShipLine1(),
          order.getShipLine2(),
          order.getShipCity(),
          order.getShipState(),
          order.getShipPostalCode(),
          order.getShipCountry(),
          false);
    }

    OrderPaymentDto paymentDto = paymentRepository.findByOrderId(order.getId())
        .map(p -> new OrderPaymentDto(p.getMethod(), p.getStatus().name(), p.getReference()))
        .orElse(null);

    List<CancellationDto> cancellations = orderCancellationRepository
        .findByOrderIdOrderByCreatedAtAsc(order.getId())
        .stream()
        .map(c -> new CancellationDto(
            c.getId(),
            c.getReason(),
            c.getValueCancelled(),
            c.getFeeRate(),
            c.getFeeAmount(),
            c.getRefundAmount(),
            c.getPointsRestored(),
            c.getRefundMethod().name(),
            c.getRefundStatus().name(),
            c.getRefundDestination(),
            c.getCreatedAt()))
        .toList();

    return new OrderDto(
        order.getId(),
        order.getStatus(),
        itemDtos,
        order.getSubtotal(),
        order.getShippingAmount(),
        order.getGiftPointsUsed(),
        order.getDiscountAmount(),
        order.getTotalAmount(),
        order.getPointsEarned(),
        order.getDeliveryDate(),
        addressDto,
        paymentDto,
        order.getCreatedAt(),
        order.getConfirmedAt(),
        order.getPackedAt(),
        order.getShippedAt(),
        order.getDeliveredAt(),
        order.getCancelledAt(),
        order.getExpiresAt(),
        isCancellable,
        cancelEndsAt,
        blockedReason,
        order.getCancellationFee(),
        order.getRefundAmount(),
        cancellations);
  }
}
