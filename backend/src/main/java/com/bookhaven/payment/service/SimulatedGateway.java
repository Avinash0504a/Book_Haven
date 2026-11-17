package com.bookhaven.payment.service;

import com.bookhaven.common.AppException;
import com.bookhaven.common.ErrorCode;
import com.bookhaven.payment.dto.PaymentDetails;
import com.bookhaven.payment.entity.PaymentMethod;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class SimulatedGateway {

  public String processPayment(PaymentMethod method, PaymentDetails details) {
    if (method == PaymentMethod.CREDIT_CARD || method == PaymentMethod.DEBIT_CARD) {
      if (details != null && details.cardNumber() != null) {
        String cleanNumber = details.cardNumber().replaceAll("[\\s-]", "");
        if (cleanNumber.endsWith("0000")) {
          throw new AppException(ErrorCode.PAYMENT_DECLINED, "Payment declined by issuing bank");
        }
      }
    }
    return "PAY-" + UUID.randomUUID().toString().substring(0, 18).toUpperCase();
  }
}
