package com.bookhaven.order.job;

import com.bookhaven.catalog.entity.BookFormat;
import com.bookhaven.catalog.repository.BookRepository;
import com.bookhaven.member.entity.GiftPointsTransaction;
import com.bookhaven.member.entity.Member;
import com.bookhaven.member.repository.GiftPointsTransactionRepository;
import com.bookhaven.member.repository.MemberRepository;
import com.bookhaven.order.entity.Order;
import com.bookhaven.order.entity.OrderItem;
import com.bookhaven.order.entity.OrderStatus;
import com.bookhaven.order.repository.OrderItemRepository;
import com.bookhaven.order.repository.OrderRepository;
import com.bookhaven.payment.entity.Payment;
import com.bookhaven.payment.entity.PaymentStatus;
import com.bookhaven.payment.repository.PaymentRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class OrderExpiryJob {

  private static final Logger log = LoggerFactory.getLogger(OrderExpiryJob.class);

  private final OrderRepository orderRepository;
  private final OrderItemRepository orderItemRepository;
  private final PaymentRepository paymentRepository;
  private final BookRepository bookRepository;
  private final MemberRepository memberRepository;
  private final GiftPointsTransactionRepository giftPointsTransactionRepository;
  private final Clock clock;

  public OrderExpiryJob(
      OrderRepository orderRepository,
      OrderItemRepository orderItemRepository,
      PaymentRepository paymentRepository,
      BookRepository bookRepository,
      MemberRepository memberRepository,
      GiftPointsTransactionRepository giftPointsTransactionRepository,
      Clock clock) {
    this.orderRepository = orderRepository;
    this.orderItemRepository = orderItemRepository;
    this.paymentRepository = paymentRepository;
    this.bookRepository = bookRepository;
    this.memberRepository = memberRepository;
    this.giftPointsTransactionRepository = giftPointsTransactionRepository;
    this.clock = clock;
  }

  @Scheduled(fixedDelay = 60000)
  @Transactional
  public int expirePendingOrders() {
    Instant now = Instant.now(clock);
    List<Order> pendingOrders = orderRepository.findAll().stream()
        .filter(o -> o.getStatus() == OrderStatus.PENDING && o.getExpiresAt() != null && now.isAfter(o.getExpiresAt()))
        .toList();

    for (Order order : pendingOrders) {
      expireOrder(order, now);
    }
    return pendingOrders.size();
  }

  public void expireOrder(Order order, Instant now) {
    order.setStatus(OrderStatus.FAILED);

    // Restore stock
    List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
    for (OrderItem item : items) {
      BookFormat format = BookFormat.valueOf(item.getFormatSnapshot());
      if (format == BookFormat.PAPERBACK || format == BookFormat.HARDCOVER) {
        bookRepository.incrementStock(item.getBookId(), item.getQuantity());
      }
    }

    // Restore gift points
    if (order.getGiftPointsUsed() > 0) {
      Member member = memberRepository.findByIdForUpdate(order.getMemberId()).orElse(null);
      if (member != null) {
        member.setGiftPoints(member.getGiftPoints() + order.getGiftPointsUsed());
        memberRepository.save(member);
        giftPointsTransactionRepository.save(new GiftPointsTransaction(
            order.getMemberId(),
            order.getId(),
            order.getGiftPointsUsed(),
            GiftPointsTransaction.Reason.RESTORED_ON_FAILURE,
            now));
      }
    }

    Payment payment = paymentRepository.findByOrderId(order.getId()).orElse(null);
    if (payment != null) {
      payment.setStatus(PaymentStatus.FAILED);
      paymentRepository.save(payment);
    }

    orderRepository.save(order);
    log.info("Expired pending order: orderId={}", order.getId());
  }
}
