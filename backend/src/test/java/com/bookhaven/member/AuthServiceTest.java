package com.bookhaven.member;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bookhaven.common.AppException;
import com.bookhaven.common.ErrorCode;
import com.bookhaven.member.dto.AuthResponse;
import com.bookhaven.member.dto.LoginRequest;
import com.bookhaven.member.dto.RegisterRequest;
import com.bookhaven.member.entity.Member;
import com.bookhaven.member.repository.MemberRepository;
import com.bookhaven.member.service.AuthService;
import com.bookhaven.security.JwtService;
import com.bookhaven.security.SecurityEventLogger;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/** T028: the service in isolation. The repository, the token service and the logger are mocked. */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

  private static final Instant NOW = Instant.parse("2026-11-14T10:00:00Z");

  @Mock MemberRepository members;
  @Mock JwtService jwtService;
  @Mock SecurityEventLogger events;

  private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);
  private AuthService service;

  @BeforeEach
  void setUp() {
    service = new AuthService(members, encoder, jwtService, events, Clock.fixed(NOW, ZoneOffset.UTC));
  }

  private Member savedMember(String email, String password) {
    return new Member("Asha Rao", email, encoder.encode(password), NOW);
  }

  @Test
  void registerHashesPassword() {
    when(members.existsByEmailIgnoreCase("asha@example.com")).thenReturn(false);
    when(members.saveAndFlush(any(Member.class))).thenAnswer(inv -> inv.getArgument(0));
    when(jwtService.issue(any())).thenReturn("token-1");

    AuthResponse response = service.register(new RegisterRequest("Asha Rao", "asha@example.com", "secret1"));

    ArgumentCaptor<Member> saved = ArgumentCaptor.forClass(Member.class);
    verify(members).saveAndFlush(saved.capture());
    assertThat(saved.getValue().getPasswordHash()).isNotEqualTo("secret1").startsWith("$2");
    assertThat(encoder.matches("secret1", saved.getValue().getPasswordHash())).isTrue();
    assertThat(response.token()).isEqualTo("token-1");
    assertThat(response.member().email()).isEqualTo("asha@example.com");
  }

  @Test
  void registerTrimsAndKeepsTheEmailAsTyped() {
    when(members.existsByEmailIgnoreCase("Asha@Example.com")).thenReturn(false);
    when(members.saveAndFlush(any(Member.class))).thenAnswer(inv -> inv.getArgument(0));
    when(jwtService.issue(any())).thenReturn("t");

    service.register(new RegisterRequest("  Asha Rao ", " Asha@Example.com ", "secret1"));

    ArgumentCaptor<Member> saved = ArgumentCaptor.forClass(Member.class);
    verify(members).saveAndFlush(saved.capture());
    assertThat(saved.getValue().getEmail()).isEqualTo("Asha@Example.com");
    assertThat(saved.getValue().getFullName()).isEqualTo("Asha Rao");
  }

  @Test
  void duplicateEmailThrowsDuplicateEmail() {
    when(members.existsByEmailIgnoreCase("asha@example.com")).thenReturn(true);

    assertThatThrownBy(() -> service.register(new RegisterRequest("Asha Rao", "asha@example.com", "secret1")))
        .isInstanceOfSatisfying(AppException.class, ex -> assertThat(ex.code()).isEqualTo(ErrorCode.DUPLICATE_EMAIL));

    verify(members, never()).saveAndFlush(any());
    verify(jwtService, never()).issue(any());
  }

  @Test
  void unknownEmailAndWrongPasswordSameError() {
    Member existing = savedMember("asha@example.com", "secret1");
    when(members.findByEmailIgnoreCase("asha@example.com")).thenReturn(Optional.of(existing));
    when(members.findByEmailIgnoreCase("nobody@example.com")).thenReturn(Optional.empty());

    AppException wrongPassword = catchApp(() -> service.login(new LoginRequest("asha@example.com", "wrong-pass")));
    AppException unknownEmail = catchApp(() -> service.login(new LoginRequest("nobody@example.com", "secret1")));

    assertThat(wrongPassword.code()).isEqualTo(ErrorCode.INVALID_CREDENTIALS);
    assertThat(unknownEmail.code()).isEqualTo(ErrorCode.INVALID_CREDENTIALS);
    assertThat(unknownEmail.getMessage()).isEqualTo(wrongPassword.getMessage());
    verify(jwtService, never()).issue(any());
  }

  @Test
  void loginIssuesToken() {
    Member existing = savedMember("asha@example.com", "secret1");
    when(members.findByEmailIgnoreCase("asha@example.com")).thenReturn(Optional.of(existing));
    when(jwtService.issue(any())).thenReturn("token-2");

    AuthResponse response = service.login(new LoginRequest("asha@example.com", "secret1"));

    assertThat(response.token()).isEqualTo("token-2");
    assertThat(response.member().email()).isEqualTo("asha@example.com");
  }

  @Test
  void failedLoginIsLoggedWithoutAnyDetail() {
    when(members.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());

    catchApp(() -> service.login(new LoginRequest("nobody@example.com", "secret1")));

    verify(events).loginFailure();
  }

  private static AppException catchApp(Runnable action) {
    return org.assertj.core.api.Assertions.catchThrowableOfType(AppException.class, action::run);
  }
}
