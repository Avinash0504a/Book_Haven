package com.bookhaven.common;

import com.bookhaven.support.IntegrationTestBase;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;

/** Base for the envelope tests: full context with the security filters off. */
@AutoConfigureMockMvc(addFilters = false)
abstract class EnvelopeTestBase extends IntegrationTestBase {}
