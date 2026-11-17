package com.bookhaven.security;

import com.bookhaven.common.AppException;
import com.bookhaven.common.ErrorCode;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/** Resolves the authenticated member id for services. Ownership checks start from this id. */
@Component
public class CurrentMember {

  public UUID id() {
    return find().orElseThrow(() -> new AppException(ErrorCode.UNAUTHORIZED, "Authentication required"));
  }

  public java.util.Optional<UUID> find() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() instanceof UUID id) {
      return java.util.Optional.of(id);
    }
    return java.util.Optional.empty();
  }
}
