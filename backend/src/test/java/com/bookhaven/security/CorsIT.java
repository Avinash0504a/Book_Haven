package com.bookhaven.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bookhaven.support.IntegrationTestBase;
import com.bookhaven.support.TestEnvironment;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

/** Exactly one origin is allowed, no wildcard. */
class CorsIT extends IntegrationTestBase {

  private static final String ALLOWED = TestEnvironment.ALLOWED_ORIGIN;

  @Autowired MockMvc mvc;

  @Test
  void allowedOriginOnly() throws Exception {
    mvc.perform(
            options("/api/auth/login")
                .header("Origin", ALLOWED)
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "authorization,content-type"))
        .andExpect(status().isOk())
        .andExpect(header().string("Access-Control-Allow-Origin", ALLOWED))
        .andExpect(header().doesNotExist("Access-Control-Allow-Credentials"));

    // CORS headers also appear on a normal response, including a 401
    mvc.perform(get("/api/auth/me").header("Origin", ALLOWED))
        .andExpect(status().isUnauthorized())
        .andExpect(header().string("Access-Control-Allow-Origin", ALLOWED));
  }

  @Test
  void otherOriginRejected() throws Exception {
    mvc.perform(
            options("/api/auth/login")
                .header("Origin", "http://evil.example")
                .header("Access-Control-Request-Method", "POST"))
        .andExpect(status().isForbidden())
        .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));

    mvc.perform(get("/api/auth/me").header("Origin", "http://evil.example"))
        .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
  }

  @Test
  void neverAWildcardAndOnlyListedMethodsAndHeaders() throws Exception {
    String allowMethods =
        mvc.perform(
                options("/api/auth/login")
                    .header("Origin", ALLOWED)
                    .header("Access-Control-Request-Method", "POST"))
            .andReturn()
            .getResponse()
            .getHeader("Access-Control-Allow-Methods");
    assertThat(allowMethods).isNotNull().doesNotContain("*").contains("POST").contains("GET");

    // a method that is not listed is refused
    mvc.perform(
            options("/api/auth/login")
                .header("Origin", ALLOWED)
                .header("Access-Control-Request-Method", "TRACE"))
        .andExpect(status().isForbidden());

    // a header that is not listed is refused
    mvc.perform(
            options("/api/auth/login")
                .header("Origin", ALLOWED)
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "x-evil-header"))
        .andExpect(status().isForbidden());
  }
}
