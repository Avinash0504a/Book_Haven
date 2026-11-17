package com.bookhaven;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class BookHavenApplication {

  public static void main(String[] args) {
    SpringApplication.run(BookHavenApplication.class, args);
  }
}
