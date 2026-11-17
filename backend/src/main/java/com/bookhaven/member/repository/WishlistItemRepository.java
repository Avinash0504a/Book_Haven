package com.bookhaven.member.repository;

import com.bookhaven.member.entity.WishlistItem;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, UUID> {

  List<WishlistItem> findByMemberIdOrderByCreatedAtDesc(UUID memberId);

  boolean existsByMemberIdAndBookId(UUID memberId, UUID bookId);

  Optional<WishlistItem> findByMemberIdAndBookId(UUID memberId, UUID bookId);

  void deleteByMemberIdAndBookId(UUID memberId, UUID bookId);
}
