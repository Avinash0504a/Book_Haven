package com.bookhaven.member.service;

import com.bookhaven.member.dto.GiftPointsEntry;
import com.bookhaven.member.entity.GiftPointsTransaction;
import com.bookhaven.member.repository.GiftPointsTransactionRepository;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PointsService {

  private final GiftPointsTransactionRepository pointsRepository;

  public PointsService(GiftPointsTransactionRepository pointsRepository) {
    this.pointsRepository = pointsRepository;
  }

  public List<GiftPointsEntry> getPointsHistory(UUID memberId) {
    List<GiftPointsTransaction> txns = pointsRepository.findByMemberIdOrderByCreatedAtDesc(memberId);

    List<GiftPointsTransaction> oldestFirst = new ArrayList<>(txns);
    Collections.reverse(oldestFirst);

    List<GiftPointsEntry> resultOldestFirst = new ArrayList<>();
    int runningBalance = 0;
    for (GiftPointsTransaction txn : oldestFirst) {
      runningBalance += txn.getPoints();
      resultOldestFirst.add(new GiftPointsEntry(
          txn.getId(),
          txn.getPoints(),
          txn.getReason().name(),
          txn.getOrderId(),
          txn.getCreatedAt(),
          runningBalance));
    }

    Collections.reverse(resultOldestFirst);
    return resultOldestFirst;
  }
}
