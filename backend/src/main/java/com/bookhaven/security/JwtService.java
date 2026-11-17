package com.bookhaven.security;

import com.bookhaven.config.AppProperties;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

/**
 * Issues and verifies the access token: HS256, 60 minutes by default, no refresh token (H5).
 * The payload holds only {@code sub} (member id), {@code iat} and {@code exp}. All JJWT use is
 * kept in this class.
 */
@Service
public class JwtService {

  private final SecretKey key;
  private final long expirationMs;
  private final Clock clock;

  public JwtService(AppProperties properties, Clock clock) {
    this.key =
        Keys.hmacShaKeyFor(properties.jwt().secret().getBytes(StandardCharsets.UTF_8));
    this.expirationMs = properties.jwt().expirationMs();
    this.clock = clock;
  }

  public String issue(UUID memberId) {
    Instant now = clock.instant();
    return Jwts.builder()
        .subject(memberId.toString())
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plusMillis(expirationMs)))
        .signWith(key, Jwts.SIG.HS256)
        .compact();
  }

  /** Returns the member id, or throws {@link InvalidTokenException}. */
  public UUID verify(String token) {
    if (token == null || token.isBlank()) {
      throw new InvalidTokenException("Token is missing");
    }
    try {
      String subject =
          Jwts.parser()
              .verifyWith(key)
              .clock(() -> Date.from(clock.instant()))
              .build()
              .parseSignedClaims(token)
              .getPayload()
              .getSubject();
      return UUID.fromString(subject);
    } catch (JwtException | IllegalArgumentException | NullPointerException ex) {
      // The cause is not attached to the message: it could echo part of the token.
      throw new InvalidTokenException("Token is not valid");
    }
  }
}
