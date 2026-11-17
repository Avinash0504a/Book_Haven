package com.bookhaven.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import com.bookhaven.BookHavenApplication;
import com.bookhaven.support.IntegrationTestBase;
import com.bookhaven.support.TestEnvironment;
import java.io.IOException;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.NetworkInterface;
import java.net.Socket;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;

/** T007: startup rules. The start-up cases never reach the database. */
class ConfigIT {

  private static final String[] REQUIRED = {
    "SPRING_DATASOURCE_URL",
    "SPRING_DATASOURCE_USERNAME",
    "SPRING_DATASOURCE_PASSWORD",
    "APP_JWT_SECRET",
    "APP_CORS_ALLOWED_ORIGIN"
  };

  private static Map<String, Object> validValues() {
    Map<String, Object> values = new HashMap<>();
    values.put("SPRING_DATASOURCE_URL", "jdbc:postgresql://127.0.0.1:1/none");
    values.put("SPRING_DATASOURCE_USERNAME", "u");
    values.put("SPRING_DATASOURCE_PASSWORD", "p");
    values.put("APP_JWT_SECRET", TestEnvironment.newSecret());
    values.put("APP_CORS_ALLOWED_ORIGIN", "http://localhost:5173");
    return values;
  }

  /** An environment that sees only the given values, never the real process environment. */
  private static StandardEnvironment isolated(Map<String, Object> values) {
    StandardEnvironment env = new StandardEnvironment();
    env.getPropertySources().remove(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME);
    env.getPropertySources().remove(StandardEnvironment.SYSTEM_PROPERTIES_PROPERTY_SOURCE_NAME);
    env.getPropertySources().addFirst(new MapPropertySource("test", values));
    return env;
  }

  private static Throwable startAndCatch(Map<String, Object> values) {
    return org.assertj.core.api.Assertions.catchThrowable(
        () ->
            new SpringApplicationBuilder(BookHavenApplication.class)
                .web(WebApplicationType.NONE)
                .environment(isolated(values))
                .run()
                .close());
  }

  private static Throwable rootStartupFailure(Throwable failure) {
    Throwable current = failure;
    while (current != null && !(current instanceof StartupConfigurationException)) {
      current = current.getCause();
    }
    return current;
  }

  @ParameterizedTest
  @ValueSource(
      strings = {
        "SPRING_DATASOURCE_URL",
        "SPRING_DATASOURCE_USERNAME",
        "SPRING_DATASOURCE_PASSWORD",
        "APP_JWT_SECRET",
        "APP_CORS_ALLOWED_ORIGIN"
      })
  void startupFailsWithoutRequiredEnv(String missing) {
    Map<String, Object> values = validValues();
    values.remove(missing);

    Throwable failure = rootStartupFailure(startAndCatch(values));

    assertThat(failure).isInstanceOf(StartupConfigurationException.class);
    assertThat(failure.getMessage()).contains(missing);
  }

  @Test
  void blankValueCountsAsMissing() {
    Map<String, Object> values = validValues();
    values.put("APP_CORS_ALLOWED_ORIGIN", "   ");

    Throwable failure = rootStartupFailure(startAndCatch(values));

    assertThat(failure).isInstanceOf(StartupConfigurationException.class);
    assertThat(failure.getMessage()).contains("APP_CORS_ALLOWED_ORIGIN");
  }

  @Test
  void jwtSecretShorterThan32BytesRejected() {
    Map<String, Object> values = validValues();
    String shortSecret = "s".repeat(31);
    values.put("APP_JWT_SECRET", shortSecret);

    Throwable failure = rootStartupFailure(startAndCatch(values));

    assertThat(failure).isInstanceOf(StartupConfigurationException.class);
    assertThat(failure.getMessage()).contains("APP_JWT_SECRET").contains("32");
    assertThat(failure.getMessage()).doesNotContain(shortSecret);
  }

  @Test
  void wildcardCorsOriginRejected() {
    Map<String, Object> values = validValues();
    values.put("APP_CORS_ALLOWED_ORIGIN", "*");

    Throwable failure = rootStartupFailure(startAndCatch(values));

    assertThat(failure).isInstanceOf(StartupConfigurationException.class);
    assertThat(failure.getMessage()).contains("APP_CORS_ALLOWED_ORIGIN");
  }

  @Test
  void errorMessageNeverContainsTheSecretValues() {
    Map<String, Object> values = validValues();
    String password = "pw-" + TestEnvironment.newSecret();
    values.put("SPRING_DATASOURCE_PASSWORD", password);
    values.remove("APP_JWT_SECRET");

    Throwable failure = rootStartupFailure(startAndCatch(values));

    assertThat(failure).isInstanceOf(StartupConfigurationException.class);
    assertThat(failure.getMessage()).doesNotContain(password);
  }

  @Test
  void validatorAcceptsACompleteConfiguration() {
    StartupValidator.validate(isolated(validValues()));
  }

  /** The running server must be reachable on loopback and on no other interface. */
  @Nested
  @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
  class Running extends IntegrationTestBase {

    @LocalServerPort int port;

    @Test
    void serverBindsToLoopback() throws IOException {
      try (Socket loopback = new Socket()) {
        loopback.connect(new InetSocketAddress("127.0.0.1", port), 2000);
        assertThat(loopback.isConnected()).isTrue();
      }

      Optional<InetAddress> external = firstNonLoopbackIpv4();
      assumeTrue(external.isPresent(), "no non-loopback IPv4 interface on this machine");
      assertThatThrownBy(
              () -> {
                try (Socket other = new Socket()) {
                  other.connect(new InetSocketAddress(external.get(), port), 2000);
                }
              })
          .isInstanceOf(IOException.class);
    }

    private Optional<InetAddress> firstNonLoopbackIpv4() throws IOException {
      for (NetworkInterface nic : Collections.list(NetworkInterface.getNetworkInterfaces())) {
        if (!nic.isUp() || nic.isLoopback()) {
          continue;
        }
        for (InetAddress address : Collections.list(nic.getInetAddresses())) {
          if (address instanceof Inet4Address && !address.isLinkLocalAddress()) {
            return Optional.of(address);
          }
        }
      }
      return Optional.empty();
    }
  }
}
