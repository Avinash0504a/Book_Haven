package com.bookhaven.member.controller;

import com.bookhaven.common.ApiResponse;
import com.bookhaven.member.dto.AuthResponse;
import com.bookhaven.member.dto.GiftPointsEntry;
import com.bookhaven.member.dto.LoginRequest;
import com.bookhaven.member.dto.MemberDto;
import com.bookhaven.member.dto.RegisterRequest;
import com.bookhaven.member.dto.UpdateProfileRequest;
import com.bookhaven.member.service.AuthService;
import com.bookhaven.member.service.PointsService;
import com.bookhaven.member.service.ProfileService;
import com.bookhaven.security.CurrentMember;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** register, login, logout, me, updateProfile and pointsHistory, exactly as in openapi.yaml. */
@RestController
@RequestMapping(path = "/api/auth", produces = MediaType.APPLICATION_JSON_VALUE)
public class AuthController {

  private final AuthService authService;
  private final ProfileService profileService;
  private final PointsService pointsService;
  private final CurrentMember currentMember;

  public AuthController(
      AuthService authService,
      ProfileService profileService,
      PointsService pointsService,
      CurrentMember currentMember) {
    this.authService = authService;
    this.profileService = profileService;
    this.pointsService = pointsService;
    this.currentMember = currentMember;
  }

  @PostMapping(path = "/register", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
    return ApiResponse.ok(authService.register(request));
  }

  @PostMapping(path = "/login", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
    return ApiResponse.ok(authService.login(request));
  }

  /** Stateless: the client discards its token. Public, so an expired session can still log out. */
  @PostMapping("/logout")
  public ApiResponse<Void> logout() {
    return ApiResponse.ok();
  }

  /** Returns {@code giftPoints} and {@code walletBalance} with the member (FR-006). */
  @GetMapping("/me")
  public ApiResponse<MemberDto> me() {
    return ApiResponse.ok(authService.me(currentMember.id()));
  }

  @PatchMapping(path = "/me", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ApiResponse<MemberDto> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
    return ApiResponse.ok(profileService.updateProfile(currentMember.id(), request.fullName()));
  }

  @GetMapping("/points-history")
  public ApiResponse<List<GiftPointsEntry>> pointsHistory() {
    return ApiResponse.ok(pointsService.getPointsHistory(currentMember.id()));
  }
}
