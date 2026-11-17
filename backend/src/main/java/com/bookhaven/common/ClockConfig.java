package com.bookhaven.common;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** The one source of "now" for the application; tests replace it with a fixed clock. */
@Configuration
public class ClockConfig {

  public static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");

  @Bean
  public Clock clock() {
    return Clock.system(ZONE);
  }
}
