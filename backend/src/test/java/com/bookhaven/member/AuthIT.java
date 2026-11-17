package com.bookhaven.member;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bookhaven.member.entity.Member;
import com.bookhaven.member.repository.MemberRepository;
import com.bookhaven.support.IntegrationTestBase;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import tools.jackson.databind.json.JsonMapper;

/** FR-001 to FR-003 through the real HTTP stack and the books_test database. */
class AuthIT extends IntegrationTestBase {

  private static final JsonMapper JSON = JsonMapper.builder().build();

  @Autowired MockMvc mvc;
  @Autowired MemberRepository members;

  @AfterEach
  void cleanUp() {
    members.deleteAll();
  }

  private static String email() {
    return "auth-" + UUID.randomUUID() + "@example.com";
  }

  private ResultActions register(String name, String email, String password) throws Exception {
    return mvc.perform(
        post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(JSON.writeValueAsString(java.util.Map.of("fullName", name, "email", email, "password", password))));
  }

  private ResultActions login(String email, String password) throws Exception {
    return mvc.perform(
        post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(JSON.writeValueAsString(java.util.Map.of("email", email, "password", password))));
  }

  @Test
  void registerOk() throws Exception {
    String email = email();

    register("Asha Rao", email, "secret1").andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.token").isNotEmpty())
        .andExpect(jsonPath("$.data.member.fullName").value("Asha Rao"))
        .andExpect(jsonPath("$.data.member.email").value(email))
        .andExpect(jsonPath("$.data.member.giftPoints").value(0))
        .andExpect(jsonPath("$.data.member.walletBalance").value(0))
        .andExpect(jsonPath("$.data.member.passwordHash").doesNotExist())
        .andExpect(jsonPath("$.data.member.password").doesNotExist());

    assertThat(members.findByEmailIgnoreCase(email)).isPresent();
  }

  @Test
  void loginOk() throws Exception {
    String email = email();
    register("Asha Rao", email, "secret1").andExpect(status().isOk());

    login(email, "secret1").andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.token").isNotEmpty())
        .andExpect(jsonPath("$.data.member.email").value(email));

    // the e-mail is not case sensitive
    login(email.toUpperCase(), "secret1").andExpect(status().isOk());
  }

  @Test
  void wrongPassword401GenericMessage() throws Exception {
    String email = email();
    register("Asha Rao", email, "secret1").andExpect(status().isOk());

    login(email, "not-the-password").andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"))
        .andExpect(jsonPath("$.message").value("Invalid email or password"));
  }

  @Test
  void unknownEmailSameMessageAsWrongPassword() throws Exception {
    String email = email();
    register("Asha Rao", email, "secret1").andExpect(status().isOk());

    String wrongPassword = login(email, "not-the-password").andReturn().getResponse().getContentAsString();
    String unknownEmail = login(email(), "secret1").andReturn().getResponse().getContentAsString();

    assertThat(JSON.readTree(unknownEmail)).isEqualTo(JSON.readTree(wrongPassword));
    assertThat(unknownEmail).doesNotContainIgnoringCase("not found").doesNotContainIgnoringCase("unknown");
  }

  @Test
  void duplicateEmail409() throws Exception {
    String email = email();
    register("Asha Rao", email, "secret1").andExpect(status().isOk());

    register("Someone Else", email.toUpperCase(), "another1").andExpect(status().isConflict())
        .andExpect(jsonPath("$.code").value("DUPLICATE_EMAIL"));

    assertThat(members.count()).isEqualTo(1);
  }

  @Test
  void shortPassword400() throws Exception {
    register("Asha Rao", email(), "12345").andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
        .andExpect(jsonPath("$.data.fieldErrors[0].field").value("password"));
    // 73 characters is over BCrypt's 72-byte limit
    register("Asha Rao", email(), "p".repeat(73)).andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.data.fieldErrors[0].field").value("password"));
    // 6 and 72 are accepted
    register("Asha Rao", email(), "123456").andExpect(status().isOk());
    register("Asha Rao", email(), "p".repeat(72)).andExpect(status().isOk());
  }

  @Test
  void invalidNameAndEmailAre400() throws Exception {
    register("A", email(), "secret1").andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.data.fieldErrors[0].field").value("fullName"));
    register("Asha Rao", "not-an-email", "secret1").andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.data.fieldErrors[0].field").value("email"));
    mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("{}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
  }

  @Test
  void logoutIsPublicAndOk() throws Exception {
    mvc.perform(post("/api/auth/logout")).andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true));
  }

  @Test
  void meReturnsPointsAndWallet() throws Exception {
    String email = email();
    String body = register("Asha Rao", email, "secret1").andReturn().getResponse().getContentAsString();
    String token = JSON.readTree(body).at("/data/token").asString();

    Member member = members.findByEmailIgnoreCase(email).orElseThrow();
    member.setGiftPoints(120);
    member.setWalletBalance(new BigDecimal("250.50"));
    members.saveAndFlush(member);

    mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.id").value(member.getId().toString()))
        .andExpect(jsonPath("$.data.email").value(email))
        .andExpect(jsonPath("$.data.giftPoints").value(120))
        .andExpect(jsonPath("$.data.walletBalance").value(250.5))
        .andExpect(jsonPath("$.data.passwordHash").doesNotExist());
  }

  @Test
  void meWithoutTokenIs401() throws Exception {
    mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
  }

  @Test
  void tokenOfADeletedMemberIs401() throws Exception {
    String body = register("Asha Rao", email(), "secret1").andReturn().getResponse().getContentAsString();
    String token = JSON.readTree(body).at("/data/token").asString();
    members.deleteAll();

    mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
  }
}
