package com.bookhaven.common;

import org.springframework.http.HttpStatus;

/**
 * Every code in the OpenAPI {@code ErrorCode} enum, each mapped to exactly one HTTP status
 * (research D5). Names are stable; never rename without a spec change.
 */
public enum ErrorCode {
  VALIDATION_ERROR(HttpStatus.BAD_REQUEST),
  UNAUTHORIZED(HttpStatus.UNAUTHORIZED),
  INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED),
  PAYMENT_DECLINED(HttpStatus.PAYMENT_REQUIRED),
  FORBIDDEN(HttpStatus.FORBIDDEN),
  NOT_FOUND(HttpStatus.NOT_FOUND),
  DUPLICATE_EMAIL(HttpStatus.CONFLICT),
  DUPLICATE_REVIEW(HttpStatus.CONFLICT),
  ALREADY_NOTIFIED(HttpStatus.CONFLICT),
  INSUFFICIENT_STOCK(HttpStatus.CONFLICT),
  PRODUCT_UNAVAILABLE(HttpStatus.CONFLICT),
  EMPTY_CART(HttpStatus.CONFLICT),
  INSUFFICIENT_WALLET_BALANCE(HttpStatus.CONFLICT),
  CANNOT_CANCEL(HttpStatus.CONFLICT),
  REFUND_CHANGED(HttpStatus.CONFLICT),
  ORDER_EXPIRED(HttpStatus.CONFLICT),
  INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR);

  private final HttpStatus status;

  ErrorCode(HttpStatus status) {
    this.status = status;
  }

  public HttpStatus status() {
    return status;
  }
}
