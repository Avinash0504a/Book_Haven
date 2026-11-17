package com.bookhaven.config;

/** Raised at startup when the configuration is unusable. The message never contains a value. */
public class StartupConfigurationException extends RuntimeException {

  public StartupConfigurationException(String message) {
    super(message);
  }
}
