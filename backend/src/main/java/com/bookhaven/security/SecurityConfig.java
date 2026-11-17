package com.bookhaven.security;

import com.bookhaven.common.ApiResponse;
import com.bookhaven.common.ErrorCode;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import tools.jackson.databind.json.JsonMapper;

/**
 * Stateless JWT security. Public routes are exactly: register, login, logout, catalogue reads,
 * recommendations, delivery estimate and covers (FR-004). Everything else needs a valid token.
 * CSRF protection is off because there are no cookies or sessions: the token travels in the
 * {@code Authorization} header, which a browser never adds on its own.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public SecurityFilterChain securityFilterChain(
      HttpSecurity http, JwtService jwtService, SecurityEventLogger events, JsonMapper mapper)
      throws Exception {
    http.csrf(csrf -> csrf.disable())
        .cors(Customizer.withDefaults())
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .httpBasic(basic -> basic.disable())
        .formLogin(form -> form.disable())
        .logout(logout -> logout.disable())
        .exceptionHandling(
            handling ->
                handling
                    .authenticationEntryPoint(
                        (request, response, ex) -> {
                          events.unauthorized(request);
                          write(mapper, response, HttpServletResponse.SC_UNAUTHORIZED,
                              ApiResponse.error(ErrorCode.UNAUTHORIZED, "Authentication required"));
                        })
                    .accessDeniedHandler(
                        (request, response, ex) -> {
                          events.forbidden(currentMemberOrNull());
                          write(mapper, response, HttpServletResponse.SC_FORBIDDEN,
                              ApiResponse.error(ErrorCode.FORBIDDEN, "Access denied"));
                        }))
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login", "/api/auth/logout")
                    .permitAll()
                    .requestMatchers(
                        HttpMethod.GET,
                        "/api/categories", "/api/categories/*/products",
                        "/api/brands", "/api/brands/*/products",
                        "/api/products", "/api/products/*",
                        "/api/products/*/related", "/api/products/*/reviews",
                        "/api/recommendations",
                        "/api/delivery/estimate",
                        "/api/authors", "/api/authors/*",
                        "/covers/**")
                    .permitAll()
                    .anyRequest()
                    .authenticated())
        .addFilterBefore(new JwtAuthFilter(jwtService, events), UsernamePasswordAuthenticationFilter.class);
    return http.build();
  }

  private static java.util.UUID currentMemberOrNull() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    return authentication != null && authentication.getPrincipal() instanceof java.util.UUID id ? id : null;
  }

  private static void write(JsonMapper mapper, HttpServletResponse response, int status, ApiResponse<?> body)
      throws IOException {
    response.setStatus(status);
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response.setCharacterEncoding("UTF-8");
    response.getWriter().write(mapper.writeValueAsString(body));
  }
}
