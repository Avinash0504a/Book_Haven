package com.bookhaven.member.dto;

public record AuthResponse(String token, MemberDto member) {

  @Override
  public String toString() {
    return "AuthResponse[member=" + member + "]";
  }
}
