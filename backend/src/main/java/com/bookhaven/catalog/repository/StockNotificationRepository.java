package com.bookhaven.catalog.repository;

import com.bookhaven.catalog.entity.StockNotification;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockNotificationRepository extends JpaRepository<StockNotification, UUID> {

  boolean existsByMemberIdAndBookId(UUID memberId, UUID bookId);
}
