package com.bookhaven.payment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bookhaven.common.AppException;
import com.bookhaven.common.ErrorCode;
import com.bookhaven.payment.dto.PaymentDetails;
import com.bookhaven.payment.entity.PaymentMethod;
import com.bookhaven.payment.service.SimulatedGateway;
import org.junit.jupiter.api.Test;

class SimulatedGatewayUT {

  private final SimulatedGateway gateway = new SimulatedGateway();

  @Test
  void cardEndingZeroesDeclined() {
    PaymentDetails details = new PaymentDetails("4111 2222 3333 0000", "John Doe", "123", "12/2030", null, null);

    assertThatThrownBy(() -> gateway.processPayment(PaymentMethod.CREDIT_CARD, details))
        .isInstanceOf(AppException.class)
        .matches(e -> ((AppException) e).code() == ErrorCode.PAYMENT_DECLINED);
  }

  @Test
  void everythingElseApproved() {
    PaymentDetails details = new PaymentDetails("4111 2222 3333 4444", "John Doe", "123", "12/2030", null, null);
    String ref = gateway.processPayment(PaymentMethod.CREDIT_CARD, details);
    assertThat(ref).startsWith("PAY-");

    String upiRef = gateway.processPayment(PaymentMethod.UPI, new PaymentDetails(null, null, null, null, "user@upi", null));
    assertThat(upiRef).startsWith("PAY-");

    String codRef = gateway.processPayment(PaymentMethod.COD, null);
    assertThat(codRef).startsWith("PAY-");
  }
}
