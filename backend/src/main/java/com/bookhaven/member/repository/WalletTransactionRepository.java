package com.bookhaven.member.repository;

import com.bookhaven.member.entity.WalletTransaction;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, UUID> {

  List<WalletTransaction> findByMemberIdOrderByCreatedAtDesc(UUID memberId);
}
