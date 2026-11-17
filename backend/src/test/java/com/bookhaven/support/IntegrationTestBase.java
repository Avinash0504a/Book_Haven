package com.bookhaven.support;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;

/** Base for tests that start the full application against the {@code books_test} database. */
@SpringBootTest
@AutoConfigureMockMvc
public abstract class IntegrationTestBase {

  static {
    TestEnvironment.init();
  }
}
