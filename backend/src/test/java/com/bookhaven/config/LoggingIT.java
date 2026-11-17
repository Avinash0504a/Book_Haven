package com.bookhaven.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bookhaven.member.repository.MemberRepository;
import com.bookhaven.support.IntegrationTestBase;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/** T026b: security events are structured JSON and never carry a secret (security policy section 8). */
@ExtendWith(OutputCaptureExtension.class)
class LoggingIT extends IntegrationTestBase {

  private static final JsonMapper JSON = JsonMapper.builder().build();

  @Autowired MockMvc mvc;
  @Autowired MemberRepository members;

  @AfterEach
  void cleanUp() {
    members.deleteAll();
  }

  /** Every line the console wrote that is a JSON object. */
  private static List<JsonNode> jsonLines(CapturedOutput output) {
    List<JsonNode> lines = new ArrayList<>();
    for (String line : output.getAll().split("\\R")) {
      String trimmed = line.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        try {
          lines.add(JSON.readTree(trimmed));
        } catch (RuntimeException ignored) {
          // not a JSON line
        }
      }
    }
    return lines;
  }

  private static List<JsonNode> events(CapturedOutput output, String event, String outcome) {
    return jsonLines(output).stream()
        .filter(n -> event.equals(n.path("event").asString("")) && outcome.equals(n.path("outcome").asString("")))
        .toList();
  }

  private String register(String email, String password) throws Exception {
    String body =
        mvc.perform(
                post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        "{\"fullName\":\"Log Tester\",\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
    return body;
  }

  private static String uniqueEmail() {
    return "log-" + UUID.randomUUID() + "@example.com";
  }

  @Test
  void logsAreJson(CapturedOutput output) throws Exception {
    mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());

    List<JsonNode> lines = jsonLines(output);
    assertThat(lines).isNotEmpty();
    JsonNode line = events(output, "ACCESS", "UNAUTHORIZED").getFirst();
    assertThat(line.path("level").asString()).isEqualTo("WARN");
    assertThat(line.path("@timestamp").asString()).isNotBlank();
    assertThat(line.path("requestId").asString()).isNotBlank();
  }

  @Test
  void loginFailureLoggedWithoutPassword(CapturedOutput output) throws Exception {
    String email = uniqueEmail();
    String password = "pw-" + UUID.randomUUID();
    register(email, password);

    String wrong = "wrong-" + UUID.randomUUID();
    mvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + wrong + "\"}"))
        .andExpect(status().isUnauthorized());

    List<JsonNode> failures = events(output, "LOGIN", "FAILURE");
    assertThat(failures).hasSize(1);
    assertThat(failures.getFirst().path("level").asString()).isEqualTo("WARN");
    assertThat(output.getAll()).doesNotContain(wrong).doesNotContain(password).doesNotContain(email);
  }

  @Test
  void loginSuccessLogsMemberIdOnly(CapturedOutput output) throws Exception {
    String email = uniqueEmail();
    String password = "pw-" + UUID.randomUUID();
    String registered = register(email, password);
    String memberId = JSON.readTree(registered).at("/data/member/id").asString();

    mvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
        .andExpect(status().isOk());

    List<JsonNode> successes = events(output, "LOGIN", "SUCCESS");
    assertThat(successes).hasSize(1);
    JsonNode line = successes.getFirst();
    assertThat(line.path("level").asString()).isEqualTo("INFO");
    assertThat(line.path("memberId").asString()).isEqualTo(memberId);
    assertThat(line.has("email")).isFalse();
    assertThat(line.has("password")).isFalse();
  }

  @Test
  void unauthorizedAndBadTokenEachWriteOneWarn(CapturedOutput output) throws Exception {
    mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    assertThat(events(output, "ACCESS", "UNAUTHORIZED")).hasSize(1);

    mvc.perform(get("/api/auth/me").header("Authorization", "Bearer not.a.token"))
        .andExpect(status().isUnauthorized());
    assertThat(events(output, "TOKEN", "REJECTED")).hasSize(1);
    // the rejected token does not also write an UNAUTHORIZED line
    assertThat(events(output, "ACCESS", "UNAUTHORIZED")).hasSize(1);
  }

  @Test
  void forbiddenAccessLogged(CapturedOutput output) throws Exception {
    String body = register(uniqueEmail(), "pw-" + UUID.randomUUID());
    JsonNode registered = JSON.readTree(body);
    String token = registered.at("/data/token").asString();
    String memberId = registered.at("/data/member/id").asString();

    mvc.perform(get("/test-support/forbidden").header("Authorization", "Bearer " + token))
        .andExpect(status().isForbidden());

    List<JsonNode> forbidden = events(output, "ACCESS", "FORBIDDEN");
    assertThat(forbidden).hasSize(1);
    assertThat(forbidden.getFirst().path("level").asString()).isEqualTo("WARN");
    assertThat(forbidden.getFirst().path("memberId").asString()).isEqualTo(memberId);
  }

  @Test
  void noTokenOrPasswordInAnyLine(CapturedOutput output) throws Exception {
    String email = uniqueEmail();
    String password = "pw-" + UUID.randomUUID();
    String registered = register(email, password);
    String token = JSON.readTree(registered).at("/data/token").asString();

    mvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
        .andExpect(status().isOk());
    mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token)).andExpect(status().isOk());
    mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token + "tampered"))
        .andExpect(status().isUnauthorized());

    String all = output.getAll();
    assertThat(all).doesNotContain(token).doesNotContain(password).doesNotContain("tampered");
    assertThat(all).doesNotContain("\"password\"").doesNotContain("Authorization");
  }

  @Test
  void everyResponseCarriesARequestId() throws Exception {
    String requestId =
        mvc.perform(get("/api/auth/me")).andReturn().getResponse().getHeader("X-Request-Id");

    assertThat(requestId).isNotBlank();
    assertThat(UUID.fromString(requestId)).isNotNull();
  }
}
