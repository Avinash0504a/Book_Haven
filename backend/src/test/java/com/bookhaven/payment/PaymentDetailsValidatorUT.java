package com.bookhaven.payment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bookhaven.common.AppException;
import com.bookhaven.common.FieldError;
import com.bookhaven.payment.dto.PaymentDetails;
import com.bookhaven.payment.entity.PaymentMethod;
import com.bookhaven.payment.service.PaymentDetailsValidator;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class PaymentDetailsValidatorUT {

  private PaymentDetailsValidator validator;
  private final ObjectMapper mapper = new ObjectMapper();

  @BeforeEach
  void setUp() {
    // Fixed clock: 2026-11-14
    Clock fixedClock = Clock.fixed(Instant.parse("2026-11-14T10:00:00Z"), ZoneId.of("Asia/Kolkata"));
    validator = new PaymentDetailsValidator(fixedClock);
  }

  @Test
  void testAllCasesFromJson() throws Exception {
    InputStream stream = getClass().getResourceAsStream("/payment-cases.json");
    assertThat(stream).isNotNull();

    JsonNode array = mapper.readTree(stream);
    assertThat(array.isArray()).isTrue();

    for (JsonNode testCase : array) {
      PaymentMethod method = PaymentMethod.valueOf(testCase.get("method").asText());
      JsonNode detailsNode = testCase.get("details");
      PaymentDetails details = new PaymentDetails(
          detailsNode.has("cardNumber") ? detailsNode.get("cardNumber").asText() : null,
          detailsNode.has("cardName") ? detailsNode.get("cardName").asText() : null,
          detailsNode.has("cvv") ? detailsNode.get("cvv").asText() : null,
          detailsNode.has("expiry") ? detailsNode.get("expiry").asText() : null,
          detailsNode.has("upiId") ? detailsNode.get("upiId").asText() : null,
          detailsNode.has("bankCode") ? detailsNode.get("bankCode").asText() : null);

      boolean expectedValid = testCase.get("valid").asBoolean();

      if (expectedValid) {
        assertThatCode(() -> validator.validate(method, details))
            .as("Case should be valid: " + testCase)
            .doesNotThrowAnyException();
      } else {
        String expectedField = testCase.get("field").asText();
        String expectedReason = testCase.get("reason").asText();

        assertThatThrownBy(() -> validator.validate(method, details))
            .as("Case should fail: " + testCase)
            .isInstanceOf(AppException.class)
            .satisfies(e -> {
              AppException appEx = (AppException) e;
              assertThat(appEx.fieldErrors())
                  .anyMatch(fe -> fe.field().equals(expectedField) && fe.reason().equals(expectedReason));
            });
      }
    }
  }
}
