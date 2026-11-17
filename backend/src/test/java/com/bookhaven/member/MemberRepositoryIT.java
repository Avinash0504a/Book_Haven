package com.bookhaven.member;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bookhaven.member.entity.Member;
import com.bookhaven.member.repository.MemberRepository;
import com.bookhaven.support.IntegrationTestBase;
import java.time.Instant;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

class MemberRepositoryIT extends IntegrationTestBase {

  @Autowired MemberRepository members;

  @AfterEach
  void cleanUp() {
    members.deleteAll();
  }

  @Test
  void emailUniqueCaseInsensitive() {
    members.saveAndFlush(new Member("Asha Rao", "Asha@Example.com", "hash", Instant.now()));

    assertThatThrownBy(
            () -> members.saveAndFlush(new Member("Asha Two", "asha@example.com", "hash", Instant.now())))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  @Test
  void findsByEmailIgnoringCase() {
    members.saveAndFlush(new Member("Asha Rao", "Asha@Example.com", "hash", Instant.now()));

    assertThat(members.findByEmailIgnoreCase("ASHA@EXAMPLE.COM")).isPresent();
    assertThat(members.existsByEmailIgnoreCase("asha@example.com")).isTrue();
    assertThat(members.findByEmailIgnoreCase("nobody@example.com")).isEmpty();
  }

  @Test
  void newMemberStartsWithZeroPointsAndWallet() {
    Member saved = members.saveAndFlush(new Member("Asha Rao", "a@example.com", "hash", Instant.now()));

    assertThat(saved.getGiftPoints()).isZero();
    assertThat(saved.getWalletBalance()).isEqualByComparingTo("0.00");
  }
}
