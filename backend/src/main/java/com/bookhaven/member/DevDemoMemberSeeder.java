package com.bookhaven.member;

import com.bookhaven.member.entity.Member;
import com.bookhaven.member.repository.MemberRepository;
import java.time.Clock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Local demo only. Runs under profile {@code dev} and only when both {@code APP_DEMO_USER_EMAIL}
 * and {@code APP_DEMO_USER_PASSWORD} are set. It inserts the member if absent and never updates an
 * existing row, so a password is never reset. There is no admin account.
 */
@Component
@Profile("dev")
public class DevDemoMemberSeeder implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(DevDemoMemberSeeder.class);

  private final MemberRepository members;
  private final PasswordEncoder passwordEncoder;
  private final Clock clock;
  private final String email;
  private final String password;

  public DevDemoMemberSeeder(
      MemberRepository members,
      PasswordEncoder passwordEncoder,
      Clock clock,
      @Value("${APP_DEMO_USER_EMAIL:}") String email,
      @Value("${APP_DEMO_USER_PASSWORD:}") String password) {
    this.members = members;
    this.passwordEncoder = passwordEncoder;
    this.clock = clock;
    this.email = email == null ? "" : email.trim();
    this.password = password == null ? "" : password;
  }

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    if (email.isEmpty() || password.isEmpty()) {
      return;
    }
    if (members.existsByEmailIgnoreCase(email)) {
      return;
    }
    members.save(new Member("Demo Member", email, passwordEncoder.encode(password), clock.instant()));
    // Neither the e-mail nor the password is written to the log.
    log.info("Demo member created");
  }
}
