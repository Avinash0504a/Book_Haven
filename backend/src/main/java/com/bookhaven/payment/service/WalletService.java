package com.bookhaven.payment.service;

import com.bookhaven.common.AppException;
import com.bookhaven.common.ErrorCode;
import com.bookhaven.common.MoneyUtil;
import com.bookhaven.member.entity.Member;
import com.bookhaven.member.entity.WalletTransaction;
import com.bookhaven.member.entity.WalletTxnType;
import com.bookhaven.member.repository.MemberRepository;
import com.bookhaven.member.repository.WalletTransactionRepository;
import com.bookhaven.payment.dto.PaymentDetails;
import com.bookhaven.payment.dto.WalletDto;
import com.bookhaven.payment.dto.WalletTransactionDto;
import com.bookhaven.payment.entity.PaymentMethod;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class WalletService {

  private final MemberRepository memberRepository;
  private final WalletTransactionRepository walletTransactionRepository;
  private final PaymentDetailsValidator paymentDetailsValidator;
  private final SimulatedGateway simulatedGateway;

  public WalletService(
      MemberRepository memberRepository,
      WalletTransactionRepository walletTransactionRepository,
      PaymentDetailsValidator paymentDetailsValidator,
      SimulatedGateway simulatedGateway) {
    this.memberRepository = memberRepository;
    this.walletTransactionRepository = walletTransactionRepository;
    this.paymentDetailsValidator = paymentDetailsValidator;
    this.simulatedGateway = simulatedGateway;
  }

  @Transactional(readOnly = true)
  public WalletDto getWallet(UUID memberId) {
    Member member = memberRepository.findById(memberId)
        .orElseThrow(() -> AppException.notFound("Member not found: " + memberId));

    List<WalletTransactionDto> txns = walletTransactionRepository
        .findByMemberIdOrderByCreatedAtDesc(memberId)
        .stream()
        .map(t -> new WalletTransactionDto(
            t.getId(),
            t.getType(),
            t.getAmount(),
            t.getSource().name(),
            t.getDescription(),
            t.getCreatedAt()))
        .toList();

    return new WalletDto(member.getWalletBalance(), txns);
  }

  public WalletDto topUp(UUID memberId, BigDecimal amount, PaymentMethod method, PaymentDetails details) {
    if (amount == null || amount.compareTo(new BigDecimal("1.00")) < 0 || amount.compareTo(new BigDecimal("100000.00")) > 0) {
      throw AppException.validation("amount", "Amount must be between 1.00 and 100,000.00", "RANGE");
    }

    if (method == PaymentMethod.WALLET || method == PaymentMethod.COD) {
      throw AppException.validation("paymentMethod", "Cannot top up wallet using WALLET or COD", "RANGE");
    }

    paymentDetailsValidator.validate(method, details);
    simulatedGateway.processPayment(method, details);

    Member member = memberRepository.findByIdForUpdate(memberId)
        .orElseThrow(() -> AppException.notFound("Member not found: " + memberId));

    BigDecimal roundedAmount = MoneyUtil.round(amount);
    member.setWalletBalance(MoneyUtil.round(member.getWalletBalance().add(roundedAmount)));
    memberRepository.save(member);

    WalletTransaction txn = new WalletTransaction(
        memberId,
        WalletTxnType.CREDIT,
        roundedAmount,
        "Wallet top-up via " + method,
        WalletTransaction.Source.TOPUP,
        Instant.now());
    walletTransactionRepository.save(txn);

    return getWallet(memberId);
  }

  public void debitForOrder(UUID memberId, BigDecimal amount, UUID orderId) {
    Member member = memberRepository.findByIdForUpdate(memberId)
        .orElseThrow(() -> AppException.notFound("Member not found: " + memberId));

    BigDecimal roundedAmount = MoneyUtil.round(amount);
    if (member.getWalletBalance().compareTo(roundedAmount) < 0) {
      throw new AppException(ErrorCode.INSUFFICIENT_WALLET_BALANCE, "Insufficient wallet balance");
    }

    member.setWalletBalance(MoneyUtil.round(member.getWalletBalance().subtract(roundedAmount)));
    memberRepository.save(member);

    WalletTransaction txn = new WalletTransaction(
        memberId,
        WalletTxnType.DEBIT,
        roundedAmount,
        "Payment for order " + orderId,
        WalletTransaction.Source.ORDER_PAYMENT,
        Instant.now());
    walletTransactionRepository.save(txn);
  }

  public void creditRefund(UUID memberId, BigDecimal amount, UUID orderId) {
    Member member = memberRepository.findByIdForUpdate(memberId)
        .orElseThrow(() -> AppException.notFound("Member not found: " + memberId));

    BigDecimal roundedAmount = MoneyUtil.round(amount);
    member.setWalletBalance(MoneyUtil.round(member.getWalletBalance().add(roundedAmount)));
    memberRepository.save(member);

    WalletTransaction txn = new WalletTransaction(
        memberId,
        WalletTxnType.CREDIT,
        roundedAmount,
        "Refund for order " + orderId,
        WalletTransaction.Source.ORDER_REFUND,
        Instant.now());
    walletTransactionRepository.save(txn);
  }
}
