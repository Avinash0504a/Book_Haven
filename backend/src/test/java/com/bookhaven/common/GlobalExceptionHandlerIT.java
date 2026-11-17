package com.bookhaven.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.test.web.servlet.MockMvc;

@ExtendWith(OutputCaptureExtension.class)
class GlobalExceptionHandlerIT extends EnvelopeTestBase {

  @Autowired MockMvc mvc;

  @Test
  void unexpectedErrorHidesDetails(CapturedOutput output) throws Exception {
    String body =
        mvc.perform(get("/test-support/boom"))
            .andExpect(status().isInternalServerError())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.code").value("INTERNAL_ERROR"))
            .andExpect(jsonPath("$.message").value("Internal server error"))
            .andReturn()
            .getResponse()
            .getContentAsString();

    assertThat(body).doesNotContain("hunter2", "secret-host", "IllegalStateException", "at com.");
    // the detail is kept server-side only, and the log line carries no password value
    assertThat(output.getAll()).contains("IllegalStateException");
  }
}
