package com.bookhaven.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.bookhaven.support.IntegrationTestBase;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Hibernate runs with {@code ddl-auto=validate}, so the context only starts when every entity
 * matches the Flyway schema. Entity or migration drift fails this class.
 */
class SchemaIT extends IntegrationTestBase {

  @Autowired JdbcTemplate jdbc;

  @Test
  void flywayMatchesEntities() {
    List<String> tables =
        jdbc.queryForList(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
            String.class);
    assertThat(tables)
        .contains(
            "member", "address", "category", "brand", "author", "book", "review",
            "stock_notification", "cart", "cart_item", "orders", "order_item", "payment",
            "order_cancellation", "gift_points_transaction", "wallet_transaction",
            "wishlist_item", "author_follow", "flyway_schema_history");
  }

  @Test
  void ddlAutoIsValidate(@Autowired org.springframework.core.env.Environment env) {
    assertThat(env.getProperty("spring.jpa.hibernate.ddl-auto")).isEqualTo("validate");
  }

  @Test
  void partialUniqueIndexAllowsOneLiveDefaultAddressPerMember() {
    String def =
        jdbc.queryForObject(
            "SELECT indexdef FROM pg_indexes WHERE indexname = 'uq_address_one_default'",
            String.class);
    assertThat(def).contains("is_default").contains("deleted_at IS NULL");
  }

  @Test
  void importantConstraintsExist() {
    List<String> names =
        jdbc.queryForList(
            "SELECT conname FROM pg_constraint WHERE connamespace = 'public'::regnamespace",
            String.class);
    assertThat(names)
        .contains(
            "uq_review_member_book", "uq_cart_item_cart_book", "uq_orders_member_idempotency",
            "uq_wishlist_member_book", "uq_author_follow_member_author",
            "uq_stock_notification_member_book", "ck_order_item_cancelled");
  }
}
