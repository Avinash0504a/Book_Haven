package com.bookhaven.member.repository;

import com.bookhaven.member.entity.GiftPointsTransaction;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GiftPointsTransactionRepository extends JpaRepository<GiftPointsTransaction, UUID> {

  List<GiftPointsTransaction> findByMemberIdOrderByCreatedAtDesc(UUID memberId);
}
