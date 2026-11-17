package com.bookhaven.support;

import java.security.SecureRandom;
import java.util.Base64;

/**
 * Supplies the five required settings to integration tests through system properties.
 *
 * <p>The database comes from {@code TEST_DATASOURCE_URL} (default {@code books_test} on localhost),
 * {@code SPRING_DATASOURCE_USERNAME} and {@code SPRING_DATASOURCE_PASSWORD}. The JWT secret is
 * generated for each test run and never read from the real environment.
 */
public final class TestEnvironment {

  public static final String ALLOWED_ORIGIN = "http://localhost:5173";

  private TestEnvironment() {}

  /** Idempotent; call from a static initializer of a test base class. */
  public static synchronized void init() {
    if (System.getProperty("SPRING_DATASOURCE_URL") != null) {
      return;
    }
    String url = System.getenv("TEST_DATASOURCE_URL");
    System.setProperty(
        "SPRING_DATASOURCE_URL",
        url == null || url.isBlank() ? "jdbc:postgresql://localhost:5432/books_test" : url);
    System.setProperty("SPRING_DATASOURCE_USERNAME", requireEnv("SPRING_DATASOURCE_USERNAME"));
    System.setProperty("SPRING_DATASOURCE_PASSWORD", requireEnv("SPRING_DATASOURCE_PASSWORD"));
    System.setProperty("APP_JWT_SECRET", newSecret());
    System.setProperty("APP_CORS_ALLOWED_ORIGIN", ALLOWED_ORIGIN);
  }

  public static String newSecret() {
    byte[] bytes = new byte[48];
    new SecureRandom().nextBytes(bytes);
    return Base64.getEncoder().encodeToString(bytes);
  }

  private static String requireEnv(String name) {
    String value = System.getenv(name);
    if (value == null || value.isBlank()) {
      throw new IllegalStateException(
          "Integration tests need the environment variable " + name + " (see quickstart.md section 4)");
    }
    return value;
  }
}
