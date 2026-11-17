package com.bookhaven.member;

import static org.assertj.core.api.Assertions.assertThat;

import com.bookhaven.member.entity.Member;
import com.bookhaven.member.repository.MemberRepository;
import com.bookhaven.support.TestEnvironment;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import com.bookhaven.BookHavenApplication;

/**
 * T027: the demo member exists only under profile {@code dev}, only when both variables are set,
 * only if absent, and its password is never reset. Each case starts its own application context
 * with explicit properties, so the real environment cannot leak in.
 */
class DevDemoMemberSeederIT {

  static {
    TestEnvironment.init();
  }

  private static final String EMAIL_KEY = "APP_DEMO_USER_EMAIL";
  private static final String PASSWORD_KEY = "APP_DEMO_USER_PASSWORD";

  private final String email = "demo-" + UUID.randomUUID() + "@example.com";

  @AfterEach
  void cleanUp() {
    try (ConfigurableApplicationContext ctx = start("dev", null, null)) {
      ctx.getBean(MemberRepository.class).deleteAll();
    }
  }

  private static ConfigurableApplicationContext start(String profile, String demoEmail, String demoPassword) {
    SpringApplicationBuilder builder =
        new SpringApplicationBuilder(BookHavenApplication.class)
            .web(WebApplicationType.NONE)
            .properties(
                "SPRING_DATASOURCE_URL=" + System.getProperty("SPRING_DATASOURCE_URL"),
                "SPRING_DATASOURCE_USERNAME=" + System.getProperty("SPRING_DATASOURCE_USERNAME"),
                "SPRING_DATASOURCE_PASSWORD=" + System.getProperty("SPRING_DATASOURCE_PASSWORD"),
                "APP_JWT_SECRET=" + System.getProperty("APP_JWT_SECRET"),
                "APP_CORS_ALLOWED_ORIGIN=" + System.getProperty("APP_CORS_ALLOWED_ORIGIN"));
    if (profile != null) {
      builder.profiles(profile);
    }
    if (demoEmail != null) {
      builder.properties(EMAIL_KEY + "=" + demoEmail);
    }
    if (demoPassword != null) {
      builder.properties(PASSWORD_KEY + "=" + demoPassword);
    }
    return builder.run();
  }

  private static long countOf(ConfigurableApplicationContext ctx, String sql, Object... args) {
    Long n = ctx.getBean(JdbcTemplate.class).queryForObject(sql, Long.class, args);
    return n == null ? 0 : n;
  }

  @Test
  void onlyInDevAndOnlyWhenAbsent() {
    String password = "demo-" + UUID.randomUUID();

    try (ConfigurableApplicationContext ctx = start(null, email, password)) {
      assertThat(countOf(ctx, "SELECT count(*) FROM member WHERE lower(email) = lower(?)", email))
          .as("no profile: nothing is seeded")
          .isZero();
    }
    try (ConfigurableApplicationContext ctx = start("test", email, password)) {
      assertThat(countOf(ctx, "SELECT count(*) FROM member WHERE lower(email) = lower(?)", email))
          .as("another profile: nothing is seeded")
          .isZero();
    }
    try (ConfigurableApplicationContext ctx = start("dev", email, null)) {
      assertThat(countOf(ctx, "SELECT count(*) FROM member WHERE lower(email) = lower(?)", email))
          .as("dev but no password variable")
          .isZero();
    }
    try (ConfigurableApplicationContext ctx = start("dev", null, password)) {
      assertThat(countOf(ctx, "SELECT count(*) FROM member")).as("dev but no email variable").isZero();
    }
    try (ConfigurableApplicationContext ctx = start("dev", email, password)) {
      assertThat(countOf(ctx, "SELECT count(*) FROM member WHERE lower(email) = lower(?)", email))
          .as("dev with both variables")
          .isEqualTo(1);
    }
    try (ConfigurableApplicationContext ctx = start("dev", email, password)) {
      assertThat(countOf(ctx, "SELECT count(*) FROM member WHERE lower(email) = lower(?)", email))
          .as("a second start inserts nothing")
          .isEqualTo(1);
    }
  }

  @Test
  void neverResetsPassword() {
    String first = "first-" + UUID.randomUUID();
    String hashAfterFirstStart;
    try (ConfigurableApplicationContext ctx = start("dev", email, first)) {
      hashAfterFirstStart = hashOf(ctx);
    }
    assertThat(hashAfterFirstStart).startsWith("$2").isNotEqualTo(first);

    try (ConfigurableApplicationContext ctx = start("dev", email, "second-" + UUID.randomUUID())) {
      assertThat(hashOf(ctx)).as("hash unchanged after a restart with another password").isEqualTo(hashAfterFirstStart);
    }
    try (ConfigurableApplicationContext ctx = start("dev", email, first)) {
      assertThat(hashOf(ctx)).isEqualTo(hashAfterFirstStart);
    }
  }

  @Test
  void noAdminAccountExists() {
    try (ConfigurableApplicationContext ctx = start("dev", email, "demo-" + UUID.randomUUID())) {
      List<String> columns =
          ctx.getBean(JdbcTemplate.class)
              .queryForList(
                  "SELECT column_name FROM information_schema.columns WHERE table_name = 'member'",
                  String.class);
      assertThat(columns).noneMatch(c -> c.toLowerCase().contains("role") || c.toLowerCase().contains("admin"));
      assertThat(countOf(ctx, "SELECT count(*) FROM member WHERE lower(email) LIKE '%admin%'")).isZero();
      assertThat(countOf(ctx, "SELECT count(*) FROM member")).isEqualTo(1);
    }
  }

  private String hashOf(ConfigurableApplicationContext ctx) {
    Member member = ctx.getBean(MemberRepository.class).findByEmailIgnoreCase(email).orElseThrow();
    return member.getPasswordHash();
  }
}
