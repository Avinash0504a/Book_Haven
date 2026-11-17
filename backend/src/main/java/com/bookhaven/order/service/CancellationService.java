package com.bookhaven.order.service;

import com.bookhaven.catalog.entity.BookFormat;
import com.bookhaven.catalog.repository.BookRepository;
import com.bookhaven.common.AppException;
import com.bookhaven.common.ErrorCode;
import com.bookhaven.common.MoneyUtil;
import com.bookhaven.member.entity.GiftPointsTransaction;
import com.bookhaven.member.entity.Member;
import com.bookhaven.member.repository.GiftPointsTransactionRepository;
import com.bookhaven.member.repository.MemberRepository;
import com.bookhaven.order.dto.BankDetailsDto;
import com.bookhaven.order.dto.CancelLine;
import com.bookhaven.order.dto.CancelPreviewDto;
import com.bookhaven.order.dto.CancelRequest;
import com.bookhaven.order.dto.OrderDto;
import com.bookhaven.order.entity.Order;
import com.bookhaven.order.entity.OrderCancellation;
import com.bookhaven.order.entity.OrderItem;
import com.bookhaven.order.entity.OrderStatus;
import com.bookhaven.order.entity.RefundMethod;
import com.bookhaven.order.entity.RefundStatus;
import com.bookhaven.order.repository.OrderCancellationRepository;
import com.bookhaven.order.repository.OrderItemRepository;
import com.bookhaven.order.repository.OrderRepository;
import com.bookhaven.payment.service.WalletService;
import tools.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CancellationService {

  private static final Duration CANCEL_WINDOW = Duration.ofHours(48);
  private static final Pattern IFSC_PATTERN = Pattern.compile("^[A-Z]{4}0[A-Z0-9]{6}$");
  private static final Pattern ACC_NUM_PATTERN = Pattern.compile("^[0-9]{9,18}$");

  private final OrderRepository orderRepository;
  private final OrderItemRepository orderItemRepository;
  private final OrderCancellationRepository orderCancellationRepository;
  private final MemberRepository memberRepository;
  private final GiftPointsTransactionRepository giftPointsTransactionRepository;
  private final BookRepository bookRepository;
  private final CancellationCalculator cancellationCalculator;
  private final WalletService walletService;
  private final CheckoutService checkoutService;
  private final Clock clock;
  private final ObjectMapper objectMapper = new ObjectMapper();

  public CancellationService(
      OrderRepository orderRepository,
      OrderItemRepository orderItemRepository,
      OrderCancellationRepository orderCancellationRepository,
      MemberRepository memberRepository,
      GiftPointsTransactionRepository giftPointsTransactionRepository,
      BookRepository bookRepository,
      CancellationCalculator cancellationCalculator,
      WalletService walletService,
      CheckoutService checkoutService,
      Clock clock) {
    this.orderRepository = orderRepository;
    this.orderItemRepository = orderItemRepository;
    this.orderCancellationRepository = orderCancellationRepository;
    this.memberRepository = memberRepository;
    this.giftPointsTransactionRepository = giftPointsTransactionRepository;
    this.bookRepository = bookRepository;
    this.cancellationCalculator = cancellationCalculator;
    this.walletService = walletService;
    this.checkoutService = checkoutService;
    this.clock = clock;
  }

  @Transactional(readOnly = true)
  public CancelPreviewDto cancelPreview(UUID memberId, UUID orderId, List<String> itemParamStrings) {
    Order order = orderRepository.findByIdAndMemberId(orderId, memberId)
        .orElseThrow(() -> AppException.notFound("Order not found: " + orderId));

    Instant now = Instant.now(clock);
    boolean insideWindow = now.isBefore(order.getCreatedAt().plus(CANCEL_WINDOW));

    if (!insideWindow) {
      return unCancellablePreview("Cancellation window (48 hours) has expired");
    }

    if (order.getStatus() != OrderStatus.CONFIRMED &&
        order.getStatus() != OrderStatus.PROCESSING &&
        order.getStatus() != OrderStatus.SHIPPED) {
      return unCancellablePreview("Order cannot be cancelled in status: " + order.getStatus());
    }

    List<OrderItem> allItems = orderItemRepository.findByOrderId(order.getId());
    List<CancelLine> lines = parseCancelLines(allItems, itemParamStrings);

    if (lines.isEmpty()) {
      return unCancellablePreview("No physical items available to cancel");
    }

    Map<UUID, OrderItem> itemMap = allItems.stream().collect(Collectors.toMap(OrderItem::getId, i -> i));
    BigDecimal valueCancelled = BigDecimal.ZERO.setScale(2);

    for (CancelLine line : lines) {
      OrderItem item = itemMap.get(line.orderItemId());
      if (item == null) {
        throw AppException.notFound("Order item not found: " + line.orderItemId());
      }
      BookFormat format = BookFormat.valueOf(item.getFormatSnapshot());
      if (format == BookFormat.EBOOK || format == BookFormat.AUDIOBOOK) {
        throw AppException.validation("items", "Digital items cannot be cancelled", "RANGE");
      }
      int available = item.getQuantity() - item.getCancelledQuantity();
      if (line.quantity() > available) {
        throw AppException.validation("items", "Requested quantity exceeds remaining quantity", "RANGE");
      }
      BigDecimal lineValue = MoneyUtil.round(item.getUnitPrice().multiply(BigDecimal.valueOf(line.quantity())));
      valueCancelled = valueCancelled.add(lineValue);
    }

    var calc = cancellationCalculator.calculate(
        order.getStatus(),
        order.getSubtotal(),
        order.getDiscountAmount(),
        order.getGiftPointsUsed(),
        valueCancelled);

    boolean finalCancellation = isFinalCancellation(allItems, lines);

    return new CancelPreviewDto(
        true,
        null,
        finalCancellation,
        lines,
        calc.valueCancelled(),
        calc.discountShare(),
        calc.feeRate(),
        calc.feeAmount(),
        calc.refundAmount(),
        calc.pointsRestored());
  }

  public OrderDto cancelOrder(UUID memberId, UUID orderId, CancelRequest request) {
    Order order = orderRepository.findByIdAndMemberId(orderId, memberId)
        .orElseThrow(() -> AppException.notFound("Order not found: " + orderId));

    Instant now = Instant.now(clock);
    boolean insideWindow = now.isBefore(order.getCreatedAt().plus(CANCEL_WINDOW));

    if (!insideWindow) {
      throw new AppException(ErrorCode.CANNOT_CANCEL, "Cancellation window (48 hours) has expired");
    }

    if (order.getStatus() != OrderStatus.CONFIRMED &&
        order.getStatus() != OrderStatus.PROCESSING &&
        order.getStatus() != OrderStatus.SHIPPED) {
      throw new AppException(ErrorCode.CANNOT_CANCEL, "Cannot cancel order in status: " + order.getStatus());
    }

    List<OrderItem> allItems = orderItemRepository.findByOrderId(order.getId());
    List<CancelLine> lines = request.items() != null && !request.items().isEmpty()
        ? request.items()
        : defaultAllPhysicalLines(allItems);

    if (lines.isEmpty()) {
      throw new AppException(ErrorCode.CANNOT_CANCEL, "No physical items available to cancel");
    }

    Map<UUID, OrderItem> itemMap = allItems.stream().collect(Collectors.toMap(OrderItem::getId, i -> i));
    BigDecimal valueCancelled = BigDecimal.ZERO.setScale(2);

    for (CancelLine line : lines) {
      OrderItem item = itemMap.get(line.orderItemId());
      if (item == null) {
        throw AppException.notFound("Order item not found: " + line.orderItemId());
      }
      BookFormat format = BookFormat.valueOf(item.getFormatSnapshot());
      if (format == BookFormat.EBOOK || format == BookFormat.AUDIOBOOK) {
        throw AppException.validation("items", "Digital items cannot be cancelled", "RANGE");
      }
      int available = item.getQuantity() - item.getCancelledQuantity();
      if (line.quantity() > available) {
        throw AppException.validation("items", "Requested quantity exceeds remaining quantity", "RANGE");
      }
      BigDecimal lineValue = MoneyUtil.round(item.getUnitPrice().multiply(BigDecimal.valueOf(line.quantity())));
      valueCancelled = valueCancelled.add(lineValue);
    }

    var calc = cancellationCalculator.calculate(
        order.getStatus(),
        order.getSubtotal(),
        order.getDiscountAmount(),
        order.getGiftPointsUsed(),
        valueCancelled);

    if (request.expectedRefund() != null &&
        calc.refundAmount().compareTo(request.expectedRefund()) != 0) {
      throw new AppException(ErrorCode.REFUND_CHANGED, "Refund amount has changed from preview");
    }

    // Process cancellations and restock
    for (CancelLine line : lines) {
      OrderItem item = itemMap.get(line.orderItemId());
      item.setCancelledQuantity(item.getCancelledQuantity() + line.quantity());
      orderItemRepository.save(item);
      bookRepository.incrementStock(item.getBookId(), line.quantity());
    }

    // Restore points
    if (calc.pointsRestored() > 0) {
      Member member = memberRepository.findByIdForUpdate(memberId).orElseThrow();
      member.setGiftPoints(member.getGiftPoints() + calc.pointsRestored());
      memberRepository.save(member);
      giftPointsTransactionRepository.save(new GiftPointsTransaction(
          memberId, order.getId(), calc.pointsRestored(), GiftPointsTransaction.Reason.RESTORED_ON_CANCEL, now));
    }

    // Handle refund
    RefundStatus refundStatus;
    String refundDestination;

    if (request.refundMethod() == RefundMethod.WALLET) {
      if (calc.refundAmount().compareTo(BigDecimal.ZERO) > 0) {
        walletService.creditRefund(memberId, calc.refundAmount(), order.getId());
      }
      refundStatus = RefundStatus.PROCESSED;
      refundDestination = "Book Haven Wallet";
    } else {
      BankDetailsDto bank = request.bank();
      if (bank == null) {
        throw AppException.validation("bank", "Bank details required for bank refund", "REQUIRED");
      }
      if (bank.accountHolder() == null || bank.accountHolder().trim().length() < 2) {
        throw AppException.validation("bank.accountHolder", "Account holder name is required", "RANGE");
      }
      if (bank.accountNumber() == null || !ACC_NUM_PATTERN.matcher(bank.accountNumber().trim()).matches()) {
        throw AppException.validation("bank.accountNumber", "Account number must be 9-18 digits", "FORMAT");
      }
      if (bank.ifsc() == null || !IFSC_PATTERN.matcher(bank.ifsc().trim()).matches()) {
        throw AppException.validation("bank.ifsc", "IFSC must be in valid format", "FORMAT");
      }

      refundStatus = RefundStatus.INITIATED;
      String acc = bank.accountNumber().trim();
      String last4 = acc.length() > 4 ? acc.substring(acc.length() - 4) : acc;
      refundDestination = "XXXXXX" + last4;
    }

    // Save cancellation record
    String itemsJson = toJson(lines);
    OrderCancellation cancellation = new OrderCancellation(
        order.getId(),
        request.reason(),
        request.note(),
        itemsJson,
        calc.valueCancelled(),
        calc.discountShare(),
        calc.grossPaid(),
        calc.feeRate(),
        calc.feeAmount(),
        calc.refundAmount(),
        calc.pointsRestored(),
        request.refundMethod(),
        refundStatus,
        refundDestination,
        now);
    orderCancellationRepository.save(cancellation);

    // Update order totals
    order.setCancellationFee(MoneyUtil.round(order.getCancellationFee().add(calc.feeAmount())));
    order.setRefundAmount(MoneyUtil.round(order.getRefundAmount().add(calc.refundAmount())));

    // Check if fully cancelled
    if (isFinalCancellation(allItems, lines)) {
      order.setStatus(OrderStatus.CANCELLED);
      order.setCancelledAt(now);
    }

    Order savedOrder = orderRepository.save(order);
    return checkoutService.toDto(savedOrder);
  }

  private boolean isFinalCancellation(List<OrderItem> allItems, List<CancelLine> lines) {
    Map<UUID, Integer> cancellingMap = lines.stream().collect(Collectors.toMap(CancelLine::orderItemId, CancelLine::quantity));
    for (OrderItem item : allItems) {
      BookFormat format = BookFormat.valueOf(item.getFormatSnapshot());
      if (format == BookFormat.PAPERBACK || format == BookFormat.HARDCOVER) {
        int cancelQty = cancellingMap.getOrDefault(item.getId(), 0);
        int remaining = item.getQuantity() - item.getCancelledQuantity() - cancelQty;
        if (remaining > 0) {
          return false;
        }
      }
    }
    return true;
  }

  private List<CancelLine> parseCancelLines(List<OrderItem> allItems, List<String> itemParamStrings) {
    if (itemParamStrings == null || itemParamStrings.isEmpty()) {
      return defaultAllPhysicalLines(allItems);
    }

    List<CancelLine> result = new ArrayList<>();
    for (String s : itemParamStrings) {
      String[] parts = s.split(":");
      if (parts.length == 2) {
        try {
          UUID itemId = UUID.fromString(parts[0].trim());
          int qty = Integer.parseInt(parts[1].trim());
          if (qty > 0) {
            result.add(new CancelLine(itemId, qty));
          }
        } catch (Exception e) {
          throw AppException.validation("items", "Invalid item cancellation format", "FORMAT");
        }
      }
    }
    return result;
  }

  private List<CancelLine> defaultAllPhysicalLines(List<OrderItem> allItems) {
    List<CancelLine> result = new ArrayList<>();
    for (OrderItem item : allItems) {
      BookFormat format = BookFormat.valueOf(item.getFormatSnapshot());
      if (format == BookFormat.PAPERBACK || format == BookFormat.HARDCOVER) {
        int remaining = item.getQuantity() - item.getCancelledQuantity();
        if (remaining > 0) {
          result.add(new CancelLine(item.getId(), remaining));
        }
      }
    }
    return result;
  }

  private CancelPreviewDto unCancellablePreview(String reason) {
    return new CancelPreviewDto(
        false,
        reason,
        false,
        List.of(),
        BigDecimal.ZERO.setScale(2),
        BigDecimal.ZERO.setScale(2),
        BigDecimal.ZERO.setScale(2),
        BigDecimal.ZERO.setScale(2),
        BigDecimal.ZERO.setScale(2),
        0);
  }

  private String toJson(Object obj) {
    try {
      return objectMapper.writeValueAsString(obj);
    } catch (Exception e) {
      return "[]";
    }
  }
}
