package com.bookhaven.member.service;

import com.bookhaven.common.AppException;
import com.bookhaven.member.dto.MemberDto;
import com.bookhaven.member.entity.Member;
import com.bookhaven.member.repository.MemberRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ProfileService {

  private final MemberRepository memberRepository;

  public ProfileService(MemberRepository memberRepository) {
    this.memberRepository = memberRepository;
  }

  public MemberDto updateProfile(UUID memberId, String fullName) {
    if (fullName == null || fullName.trim().length() < 2 || fullName.trim().length() > 100) {
      throw AppException.validation("fullName", "fullName must be between 2 and 100 characters", "LENGTH");
    }

    Member member = memberRepository.findById(memberId)
        .orElseThrow(() -> AppException.notFound("Member not found: " + memberId));

    member.setFullName(fullName.trim());
    member = memberRepository.save(member);

    return new MemberDto(
        member.getId(),
        member.getFullName(),
        member.getEmail(),
        member.getGiftPoints(),
        member.getWalletBalance());
  }
}
