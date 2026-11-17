package com.bookhaven.catalog.repository;

import com.bookhaven.catalog.entity.AuthorFollow;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthorFollowRepository extends JpaRepository<AuthorFollow, UUID> {

  List<AuthorFollow> findByMemberIdOrderByCreatedAtDesc(UUID memberId);

  boolean existsByMemberIdAndAuthorId(UUID memberId, UUID authorId);

  Optional<AuthorFollow> findByMemberIdAndAuthorId(UUID memberId, UUID authorId);

  void deleteByMemberIdAndAuthorId(UUID memberId, UUID authorId);
}
