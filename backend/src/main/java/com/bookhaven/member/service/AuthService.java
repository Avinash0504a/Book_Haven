package com.bookhaven.member.service;

import com.bookhaven.common.AppException;
import com.bookhaven.common.ErrorCode;
import com.bookhaven.member.dto.AuthResponse;
import com.bookhaven.member.dto.LoginRequest;
import com.bookhaven.member.dto.MemberDto;
import com.bookhaven.member.dto.RegisterRequest;
import com.bookhaven.member.entity.Member;
import com.bookhaven.member.repository.MemberRepository;
import com.bookhaven.security.JwtService;
import com.bookhaven.security.SecurityEventLogger;
import java.time.Clock;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Register, log in and read the current member (FR-001 to FR-003). */
@Service
public class AuthService {

  static final String INVALID_CREDENTIALS_MESSAGE = "Invalid email or password";

  /** Hashed once at start-up so a login for an unknown e-mail costs the same time as a real one. */
  private final String decoyHash;

  private final MemberRepository members;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final SecurityEventLogger events;
  private final Clock clock;

  public AuthService(
      MemberRepository members,
      PasswordEncoder passwordEncoder,
      JwtService jwtService,
      SecurityEventLogger events,
      Clock clock) {
    this.members = members;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
    this.events = events;
    this.clock = clock;
    this.decoyHash = passwordEncoder.encode(UUID.randomUUID().toString());
  }

  @Transactional
  public AuthResponse register(RegisterRequest request) {
    String email = request.email().trim();
    if (members.existsByEmailIgnoreCase(email)) {
      throw new AppException(ErrorCode.DUPLICATE_EMAIL, "This email is already registered");
    }
    Member member =
        new Member(
            request.fullName().trim(),
            email,
            passwordEncoder.encode(request.password()),
            clock.instant());
    try {
      member = members.saveAndFlush(member);
    } catch (DataIntegrityViolationException ex) {
      // Two sign-ups raced; the unique index on lower(email) decided.
      throw new AppException(ErrorCode.DUPLICATE_EMAIL, "This email is already registered");
    }
    events.registered(member.getId());
    return new AuthResponse(jwtService.issue(member.getId()), MemberDto.from(member));
  }

  @Transactional(readOnly = true)
  public AuthResponse login(LoginRequest request) {
    Member member = members.findByEmailIgnoreCase(request.email().trim()).orElse(null);
    String hash = member == null ? decoyHash : member.getPasswordHash();
    boolean matches = passwordEncoder.matches(request.password(), hash);
    if (member == null || !matches) {
      events.loginFailure();
      // The same error and message for an unknown e-mail and a wrong password (FR-003).
      throw new AppException(ErrorCode.INVALID_CREDENTIALS, INVALID_CREDENTIALS_MESSAGE);
    }
    events.loginSuccess(member.getId());
    return new AuthResponse(jwtService.issue(member.getId()), MemberDto.from(member));
  }

  /** A valid token whose member no longer exists is treated as not logged in. */
  @Transactional(readOnly = true)
  public MemberDto me(UUID memberId) {
    return members
        .findById(memberId)
        .map(MemberDto::from)
        .orElseThrow(() -> new AppException(ErrorCode.UNAUTHORIZED, "Authentication required"));
  }
}
