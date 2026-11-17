package com.bookhaven.catalog.repository;

import com.bookhaven.catalog.entity.Review;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, UUID> {

  List<Review> findByBookIdOrderByCreatedAtDesc(UUID bookId);

  boolean existsByMemberIdAndBookId(UUID memberId, UUID bookId);

  Optional<Review> findByMemberIdAndBookId(UUID memberId, UUID bookId);
}
