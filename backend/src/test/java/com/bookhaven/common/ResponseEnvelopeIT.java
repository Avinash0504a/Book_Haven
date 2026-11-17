package com.bookhaven.common;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

class ResponseEnvelopeIT extends EnvelopeTestBase {

  @Autowired MockMvc mvc;

  @Test
  void successAndErrorsUseEnvelope() throws Exception {
    mvc.perform(get("/test-support/ok"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.value").value(1))
        .andExpect(jsonPath("$.code").doesNotExist())
        .andExpect(jsonPath("$.message").doesNotExist());

    mvc.perform(get("/test-support/conflict"))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.code").value("DUPLICATE_EMAIL"))
        .andExpect(jsonPath("$.message").value("Email is already registered"));
  }

  @Test
  void unknownRouteUsesEnvelopeToo() throws Exception {
    mvc.perform(get("/test-support/does-not-exist"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.code").value("NOT_FOUND"));
  }
}
