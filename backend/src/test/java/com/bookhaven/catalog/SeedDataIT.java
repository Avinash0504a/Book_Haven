package com.bookhaven.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import com.bookhaven.support.IntegrationTestBase;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

class SeedDataIT extends IntegrationTestBase {

  @Autowired JdbcTemplate jdbc;

  private int count(String sql) {
    Integer n = jdbc.queryForObject(sql, Integer.class);
    return n == null ? 0 : n;
  }

  @Test
  void categoriesPresent() {
    assertThat(count("SELECT count(*) FROM category")).isEqualTo(19);
  }

  @Test
  void brandsPresent() {
    assertThat(count("SELECT count(*) FROM brand")).isGreaterThanOrEqualTo(6);
  }

  @Test
  void booksCoverAllFormatsAndLanguages() {
    List<String> formats = jdbc.queryForList("SELECT DISTINCT format FROM book", String.class);
    assertThat(formats).containsExactlyInAnyOrder("PAPERBACK", "HARDCOVER", "EBOOK", "AUDIOBOOK");
    List<String> languages = jdbc.queryForList("SELECT DISTINCT language FROM book", String.class);
    assertThat(languages)
        .containsExactlyInAnyOrder("English", "Hindi", "Tamil", "Telugu", "Kannada");
    assertThat(count("SELECT count(*) FROM book WHERE discount_percent > 0")).isPositive();
    assertThat(
            count(
                "SELECT count(*) FROM book WHERE format IN ('PAPERBACK','HARDCOVER') AND stock_quantity = 0"))
        .isPositive();
    assertThat(count("SELECT count(*) FROM book WHERE cover_image_url <> '/covers/' || slug || '.svg'"))
        .isZero();
  }

  @Test
  void everyCategoryFormatAndLanguageHasAtLeastThreeBooks() {
    assertThat(
            jdbc.queryForList(
                "SELECT c.slug FROM category c LEFT JOIN book b ON b.category_id = c.id "
                    + "GROUP BY c.slug HAVING count(b.id) < 3",
                String.class))
        .isEmpty();
    assertThat(
            jdbc.queryForList(
                "SELECT format FROM book GROUP BY format HAVING count(*) < 3", String.class))
        .isEmpty();
    assertThat(
            jdbc.queryForList(
                "SELECT language FROM book GROUP BY language HAVING count(*) < 3", String.class))
        .isEmpty();
  }

  @Test
  void everyAuthorHasAPortraitFile() {
    assertThat(count("SELECT count(*) FROM author WHERE image_url IS NULL")).isZero();
    List<String> urls = jdbc.queryForList("SELECT image_url FROM author", String.class);
    assertThat(urls).isNotEmpty();
    for (String url : urls) {
      assertThat(new org.springframework.core.io.ClassPathResource("static" + url).exists())
          .as(url)
          .isTrue();
    }
    assertThat(count("SELECT count(*) FROM author WHERE image_url <> '/covers/authors/' || slug || '.svg'"))
        .isZero();
  }

  /** The catalogue comes from Flyway, so it exists whatever profile is active. */
  @Test
  void catalogSeededInAnyProfile() {
    assertThat(count("SELECT count(*) FROM flyway_schema_history WHERE version = '2' AND success"))
        .isEqualTo(1);
    assertThat(count("SELECT count(*) FROM book")).isGreaterThanOrEqualTo(30);
  }

  @Test
  void noMembersCredentialsOrOrdersAreSeeded() {
    assertThat(count("SELECT count(*) FROM member")).isZero();
    assertThat(count("SELECT count(*) FROM orders")).isZero();
    assertThat(count("SELECT count(*) FROM review")).isZero();
  }
}
