package com.bookhaven.config;

import java.nio.charset.StandardCharsets;
import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.Environment;

/**
 * Fails fast, before the application context exists, when a required variable is missing or
 * unsafe. Messages name the variable only and never print its value.
 *
 * <p>Registered in {@code META-INF/spring.factories}.
 */
public class StartupValidator implements EnvironmentPostProcessor {

  static final String[] REQUIRED = {
    "SPRING_DATASOURCE_URL",
    "SPRING_DATASOURCE_USERNAME",
    "SPRING_DATASOURCE_PASSWORD",
    "APP_JWT_SECRET",
    "APP_CORS_ALLOWED_ORIGIN"
  };

  static final int MIN_JWT_SECRET_BYTES = 32;

  @Override
  public void postProcessEnvironment(
      ConfigurableEnvironment environment, SpringApplication application) {
    validate(environment);
  }

  public static void validate(Environment environment) {
    for (String name : REQUIRED) {
      String value = environment.getProperty(name);
      if (value == null || value.isBlank()) {
        throw new StartupConfigurationException(
            "Required environment variable " + name + " is not set");
      }
    }

    String secret = environment.getProperty("APP_JWT_SECRET");
    if (secret.getBytes(StandardCharsets.UTF_8).length < MIN_JWT_SECRET_BYTES) {
      throw new StartupConfigurationException(
          "APP_JWT_SECRET must be at least " + MIN_JWT_SECRET_BYTES + " bytes long");
    }

    String origin = environment.getProperty("APP_CORS_ALLOWED_ORIGIN").trim();
    if (origin.contains("*")) {
      throw new StartupConfigurationException(
          "APP_CORS_ALLOWED_ORIGIN must be one exact origin; wildcards are not allowed");
    }
  }
}
