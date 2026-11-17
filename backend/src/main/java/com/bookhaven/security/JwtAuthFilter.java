package com.bookhaven.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Reads {@code Authorization: Bearer <token>}. A valid token authenticates the request; a bad
 * token leaves it anonymous, so protected routes answer 401 and public routes still work.
 * Not a Spring bean (that would register it twice); {@link SecurityConfig} creates it.
 */
public class JwtAuthFilter extends OncePerRequestFilter {

  private static final String BEARER = "Bearer ";

  private final JwtService jwtService;
  private final SecurityEventLogger events;

  public JwtAuthFilter(JwtService jwtService, SecurityEventLogger events) {
    this.jwtService = jwtService;
    this.events = events;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    String header = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (header != null && header.regionMatches(true, 0, BEARER, 0, BEARER.length())) {
      String token = header.substring(BEARER.length()).trim();
      if (!token.isEmpty()) {
        try {
          UUID memberId = jwtService.verify(token);
          UsernamePasswordAuthenticationToken authentication =
              UsernamePasswordAuthenticationToken.authenticated(
                  memberId, null, List.of(new SimpleGrantedAuthority("ROLE_MEMBER")));
          SecurityContext context = SecurityContextHolder.createEmptyContext();
          context.setAuthentication(authentication);
          SecurityContextHolder.setContext(context);
        } catch (InvalidTokenException ex) {
          events.tokenRejected(request);
        }
      }
    }
    chain.doFilter(request, response);
  }
}
