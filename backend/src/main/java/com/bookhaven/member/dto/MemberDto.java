package com.bookhaven.member.dto;

import com.bookhaven.member.entity.Member;
import java.math.BigDecimal;
import java.util.UUID;

/** The member as the API shows it. There is no password or hash field to leak. */
public record MemberDto(
    UUID id, String fullName, String email, int giftPoints, BigDecimal walletBalance) {

  public static MemberDto from(Member member) {
    return new MemberDto(
        member.getId(),
        member.getFullName(),
        member.getEmail(),
        member.getGiftPoints(),
        member.getWalletBalance());
  }
}
