package com.bookhaven.payment.service;

import com.bookhaven.common.AppException;
import com.bookhaven.common.FieldError;
import com.bookhaven.payment.dto.BankDto;
import com.bookhaven.payment.dto.PaymentDetails;
import com.bookhaven.payment.entity.PaymentMethod;
import java.time.Clock;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

@Service
public class PaymentDetailsValidator {

  public static final List<BankDto> SUPPORTED_BANKS = List.of(
      new BankDto("HDFC", "HDFC Bank"),
      new BankDto("ICICI", "ICICI Bank"),
      new BankDto("SBI", "State Bank of India"),
      new BankDto("AXIS", "Axis Bank"),
      new BankDto("KOTAK", "Kotak Mahindra Bank"));

  private static final Set<String> BANK_CODES = Set.of("HDFC", "ICICI", "SBI", "AXIS", "KOTAK");
  private static final Pattern CARD_NAME_PATTERN = Pattern.compile("^[a-zA-Z\\s]{2,50}$");
  private static final Pattern CVV_PATTERN = Pattern.compile("^[0-9]{3}$");
  private static final Pattern EXPIRY_PATTERN = Pattern.compile("^(0[1-9]|1[0-2])/[0-9]{4}$");
  private static final Pattern UPI_PATTERN = Pattern.compile("^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+$");
  private static final DateTimeFormatter EXPIRY_FORMATTER = DateTimeFormatter.ofPattern("MM/yyyy");
  private static final ZoneId KOLKATA_ZONE = ZoneId.of("Asia/Kolkata");

  private final Clock clock;

  public PaymentDetailsValidator(Clock clock) {
    this.clock = clock;
  }

  public List<BankDto> getSupportedBanks() {
    return SUPPORTED_BANKS;
  }

  public void validate(PaymentMethod method, PaymentDetails details) {
    if (method == PaymentMethod.WALLET || method == PaymentMethod.COD) {
      return;
    }

    if (details == null) {
      throw AppException.validation("payment", "Payment details are required", "REQUIRED");
    }

    List<FieldError> errors = new ArrayList<>();

    switch (method) {
      case CREDIT_CARD, DEBIT_CARD -> validateCard(details, errors);
      case UPI -> validateUpi(details, errors);
      case NET_BANKING -> validateNetBanking(details, errors);
      default -> {}
    }

    if (!errors.isEmpty()) {
      throw AppException.validation(errors);
    }
  }

  private void validateCard(PaymentDetails details, List<FieldError> errors) {
    String rawNumber = details.cardNumber();
    if (rawNumber == null || rawNumber.isBlank()) {
      errors.add(new FieldError("payment.cardNumber", "Card number is required", "REQUIRED"));
    } else {
      String cleanNumber = rawNumber.replaceAll("[\\s-]", "");
      if (!cleanNumber.matches("^[0-9]{16}$")) {
        errors.add(new FieldError("payment.cardNumber", "Card number must be exactly 16 digits", "FORMAT"));
      }
    }

    String cardName = details.cardName();
    if (cardName == null || cardName.isBlank()) {
      errors.add(new FieldError("payment.cardName", "Name on card is required", "REQUIRED"));
    } else if (!CARD_NAME_PATTERN.matcher(cardName.trim()).matches()) {
      errors.add(new FieldError("payment.cardName", "Name on card must be 2 to 50 letters", "RANGE"));
    }

    String cvv = details.cvv();
    if (cvv == null || cvv.isBlank()) {
      errors.add(new FieldError("payment.cvv", "CVV is required", "REQUIRED"));
    } else if (!CVV_PATTERN.matcher(cvv.trim()).matches()) {
      errors.add(new FieldError("payment.cvv", "CVV must be exactly 3 digits", "FORMAT"));
    }

    String expiry = details.expiry();
    if (expiry == null || expiry.isBlank()) {
      errors.add(new FieldError("payment.expiry", "Expiry date is required", "REQUIRED"));
    } else if (!EXPIRY_PATTERN.matcher(expiry.trim()).matches()) {
      errors.add(new FieldError("payment.expiry", "Expiry must be in MM/YYYY format", "FORMAT"));
    } else {
      try {
        YearMonth expiryYm = YearMonth.parse(expiry.trim(), EXPIRY_FORMATTER);
        YearMonth currentYm = YearMonth.now(clock.withZone(KOLKATA_ZONE));
        if (expiryYm.isBefore(currentYm)) {
          errors.add(new FieldError("payment.expiry", "Card has expired", "EXPIRED"));
        }
      } catch (Exception e) {
        errors.add(new FieldError("payment.expiry", "Invalid expiry date", "FORMAT"));
      }
    }
  }

  private void validateUpi(PaymentDetails details, List<FieldError> errors) {
    String upiId = details.upiId();
    if (upiId == null || upiId.isBlank()) {
      errors.add(new FieldError("payment.upiId", "UPI ID is required", "REQUIRED"));
    } else if (!UPI_PATTERN.matcher(upiId.trim()).matches()) {
      errors.add(new FieldError("payment.upiId", "Invalid UPI ID format (expected name@handle)", "FORMAT"));
    }
  }

  private void validateNetBanking(PaymentDetails details, List<FieldError> errors) {
    String bankCode = details.bankCode();
    if (bankCode == null || bankCode.isBlank()) {
      errors.add(new FieldError("payment.bankCode", "Bank code is required", "REQUIRED"));
    } else if (!BANK_CODES.contains(bankCode.trim().toUpperCase())) {
      errors.add(new FieldError("payment.bankCode", "Bank code is not supported", "FORMAT"));
    }
  }
}
