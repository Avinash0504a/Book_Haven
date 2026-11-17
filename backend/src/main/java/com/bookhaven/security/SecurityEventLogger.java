package com.bookhaven.security;

import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Writes security events as structured log lines with the fields {@code event}, {@code memberId},
 * {@code outcome} and (from the MDC) {@code requestId}. It never receives a password, token,
 * e-mail address, payment value or request body, so none can be logged.
 */
@Component
public class SecurityEventLogger {

  /** Set on a request once a rejection was logged, so one request writes one line. */
  static final String LOGGED_ATTRIBUTE = SecurityEventLogger.class.getName() + ".LOGGED";

  private static final Logger log = LoggerFactory.getLogger("com.bookhaven.security.events");

  public void loginSuccess(UUID memberId) {
    log.atInfo()
        .addKeyValue("event", "LOGIN")
        .addKeyValue("memberId", memberId)
        .addKeyValue("outcome", "SUCCESS")
        .log("Login succeeded");
  }

  public void loginFailure() {
    log.atWarn()
        .addKeyValue("event", "LOGIN")
        .addKeyValue("outcome", "FAILURE")
        .log("Login failed");
  }

  public void registered(UUID memberId) {
    log.atInfo()
        .addKeyValue("event", "REGISTER")
        .addKeyValue("memberId", memberId)
        .addKeyValue("outcome", "SUCCESS")
        .log("Member registered");
  }

  public void tokenRejected(HttpServletRequest request) {
    request.setAttribute(LOGGED_ATTRIBUTE, Boolean.TRUE);
    log.atWarn()
        .addKeyValue("event", "TOKEN")
        .addKeyValue("outcome", "REJECTED")
        .log("Access token rejected");
  }

  public void unauthorized(HttpServletRequest request) {
    if (request.getAttribute(LOGGED_ATTRIBUTE) != null) {
      return;
    }
    request.setAttribute(LOGGED_ATTRIBUTE, Boolean.TRUE);
    log.atWarn()
        .addKeyValue("event", "ACCESS")
        .addKeyValue("outcome", "UNAUTHORIZED")
        .log("Request without valid authentication");
  }

  public void forbidden(UUID memberId) {
    log.atWarn()
        .addKeyValue("event", "ACCESS")
        .addKeyValue("memberId", memberId)
        .addKeyValue("outcome", "FORBIDDEN")
        .log("Access to another member's resource refused");
  }
}
