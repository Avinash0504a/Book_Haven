package com.bookhaven.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bookhaven.config.AppProperties;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/** T023: token rules with a fixed clock. No Spring context and no database. */
class JwtServiceTest {

  private static final String SECRET = "unit-test-secret-that-is-at-least-32-bytes-long!";
  private static final Instant NOW = Instant.parse("2026-11-14T10:00:00Z");

  private static JwtService serviceAt(Instant now, String secret, long expirationMs) {
    AppProperties props =
        new AppProperties(new AppProperties.Jwt(secret, expirationMs), null, null, null, null, null);
    return new JwtService(props, Clock.fixed(now, ZoneOffset.UTC));
  }

  @Test
  void issuesTokenWith60MinuteLifetime() throws Exception {
    JwtService service = serviceAt(NOW, SECRET, 3_600_000L);
    UUID memberId = UUID.randomUUID();

    String token = service.issue(memberId);

    JsonNode payload = JsonMapper.builder().build().readTree(decodePayload(token));
    long lifetimeSeconds = payload.get("exp").asLong() - payload.get("iat").asLong();
    assertThat(Duration.ofSeconds(lifetimeSeconds)).isEqualTo(Duration.ofMinutes(60));
    assertThat(payload.get("sub").asString()).isEqualTo(memberId.toString());
    assertThat(service.verify(token)).isEqualTo(memberId);
  }

  @Test
  void carriesNoPersonalDataInThePayload() throws Exception {
    String token = serviceAt(NOW, SECRET, 3_600_000L).issue(UUID.randomUUID());

    JsonNode payload = JsonMapper.builder().build().readTree(decodePayload(token));
    assertThat(payload.propertyNames()).containsExactlyInAnyOrder("sub", "iat", "exp");
  }

  @Test
  void rejectsTamperedToken() {
    JwtService service = serviceAt(NOW, SECRET, 3_600_000L);
    String token = service.issue(UUID.randomUUID());

    String[] parts = token.split("\\.");
    String forgedPayload =
        Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(
                ("{\"sub\":\"" + UUID.randomUUID() + "\",\"iat\":1,\"exp\":99999999999}")
                    .getBytes(StandardCharsets.UTF_8));
    String tampered = parts[0] + "." + forgedPayload + "." + parts[2];

    assertThatThrownBy(() -> service.verify(tampered)).isInstanceOf(InvalidTokenException.class);
    assertThatThrownBy(() -> service.verify(token + "x")).isInstanceOf(InvalidTokenException.class);
  }

  @Test
  void rejectsTokenSignedWithAnotherSecret() {
    String token = serviceAt(NOW, SECRET, 3_600_000L).issue(UUID.randomUUID());
    JwtService other = serviceAt(NOW, "a-completely-different-secret-of-32-bytes-or-more", 3_600_000L);

    assertThatThrownBy(() -> other.verify(token)).isInstanceOf(InvalidTokenException.class);
  }

  @Test
  void rejectsExpiredToken() {
    String token = serviceAt(NOW, SECRET, 3_600_000L).issue(UUID.randomUUID());

    JwtService justInside = serviceAt(NOW.plus(Duration.ofMinutes(59)), SECRET, 3_600_000L);
    JwtService justOutside = serviceAt(NOW.plus(Duration.ofMinutes(61)), SECRET, 3_600_000L);

    assertThat(justInside.verify(token)).isNotNull();
    assertThatThrownBy(() -> justOutside.verify(token)).isInstanceOf(InvalidTokenException.class);
  }

  @Test
  void rejectsGarbageAndEmptyTokens() {
    JwtService service = serviceAt(NOW, SECRET, 3_600_000L);

    assertThatThrownBy(() -> service.verify("not-a-jwt")).isInstanceOf(InvalidTokenException.class);
    assertThatThrownBy(() -> service.verify("")).isInstanceOf(InvalidTokenException.class);
    assertThatThrownBy(() -> service.verify(null)).isInstanceOf(InvalidTokenException.class);
  }

  @Test
  void rejectsUnsignedToken() {
    JwtService service = serviceAt(NOW, SECRET, 3_600_000L);
    String header = Base64.getUrlEncoder().withoutPadding().encodeToString("{\"alg\":\"none\"}".getBytes(StandardCharsets.UTF_8));
    String payload =
        Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(("{\"sub\":\"" + UUID.randomUUID() + "\",\"exp\":99999999999}").getBytes(StandardCharsets.UTF_8));

    assertThatThrownBy(() -> service.verify(header + "." + payload + "."))
        .isInstanceOf(InvalidTokenException.class);
  }

  private static String decodePayload(String token) {
    return new String(Base64.getUrlDecoder().decode(token.split("\\.")[1]), StandardCharsets.UTF_8);
  }
}
