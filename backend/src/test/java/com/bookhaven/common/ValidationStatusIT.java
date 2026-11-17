package com.bookhaven.common;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/** FR-074a: every validation failure is 400 with field errors, never 422. */
class ValidationStatusIT extends EnvelopeTestBase {

  @Autowired MockMvc mvc;

  @Test
  void everyValidationFailureIs400WithFieldErrors() throws Exception {
    // malformed JSON
    mvc.perform(post("/test-support/body").contentType(MediaType.APPLICATION_JSON).content("{not json"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

    // missing field
    mvc.perform(post("/test-support/body").contentType(MediaType.APPLICATION_JSON).content("{\"count\":2}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
        .andExpect(jsonPath("$.data.fieldErrors[0].field").value("name"))
        .andExpect(jsonPath("$.data.fieldErrors[0].reason").value("REQUIRED"));

    // rule violated (range)
    mvc.perform(
            post("/test-support/body")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"a\",\"count\":0}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.data.fieldErrors[0].field").value("count"))
        .andExpect(jsonPath("$.data.fieldErrors[0].reason").value("RANGE"));

    // wrong type in the body
    mvc.perform(
            post("/test-support/body")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"a\",\"count\":\"many\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

    // bad type in the query string
    mvc.perform(get("/test-support/typed").param("n", "abc"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
        .andExpect(jsonPath("$.data.fieldErrors[0].field").value("n"));

    // missing query parameter
    mvc.perform(get("/test-support/typed"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.data.fieldErrors[0].field").value("n"))
        .andExpect(jsonPath("$.data.fieldErrors[0].reason").value("REQUIRED"));

    // business-rule violation raised by the service layer
    mvc.perform(get("/test-support/rule"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
        .andExpect(jsonPath("$.data.fieldErrors[0].field").value("points"))
        .andExpect(jsonPath("$.data.fieldErrors[0].reason").value("INSUFFICIENT_POINTS"));
  }
}
