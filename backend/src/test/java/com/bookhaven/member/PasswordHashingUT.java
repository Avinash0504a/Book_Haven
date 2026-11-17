package com.bookhaven.member;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

class PasswordHashingUT {

  private final PasswordEncoder encoder = new BCryptPasswordEncoder();

  @Test
  void storesBCryptNotPlaintext() {
    String password = "pw-" + UUID.randomUUID();

    String hash = encoder.encode(password);

    assertThat(hash).isNotEqualTo(password).doesNotContain(password);
    assertThat(hash).matches("^\\$2[aby]\\$\\d{2}\\$.{53}$");
    assertThat(hash.length()).isLessThanOrEqualTo(100); // the member.password_hash column
    assertThat(encoder.matches(password, hash)).isTrue();
    assertThat(encoder.matches("other", hash)).isFalse();
  }

  @Test
  void samePasswordGivesDifferentHashes() {
    assertThat(encoder.encode("secret1")).isNotEqualTo(encoder.encode("secret1"));
  }
}
