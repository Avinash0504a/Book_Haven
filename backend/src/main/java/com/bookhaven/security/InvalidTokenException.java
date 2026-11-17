package com.bookhaven.security;

/** The token is missing, malformed, tampered with or expired. The message never holds the token. */
public class InvalidTokenException extends RuntimeException {

  public InvalidTokenException(String message) {
    super(message);
  }

  public InvalidTokenException(String message, Throwable cause) {
    super(message, cause);
  }
}
