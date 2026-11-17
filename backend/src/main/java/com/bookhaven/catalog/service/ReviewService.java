package com.bookhaven.catalog.service;

import com.bookhaven.catalog.dto.ReviewDto;
import com.bookhaven.catalog.entity.Book;
import com.bookhaven.catalog.entity.Review;
import com.bookhaven.catalog.repository.BookRepository;
import com.bookhaven.catalog.repository.ReviewRepository;
import com.bookhaven.common.AppException;
import com.bookhaven.common.ErrorCode;
import com.bookhaven.member.entity.Member;
import com.bookhaven.member.repository.MemberRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ReviewService {

  private final ReviewRepository reviewRepository;
  private final BookRepository bookRepository;
  private final MemberRepository memberRepository;

  public ReviewService(
      ReviewRepository reviewRepository,
      BookRepository bookRepository,
      MemberRepository memberRepository) {
    this.reviewRepository = reviewRepository;
    this.bookRepository = bookRepository;
    this.memberRepository = memberRepository;
  }

  @Transactional(readOnly = true)
  public List<ReviewDto> listReviews(UUID bookId) {
    if (!bookRepository.existsById(bookId)) {
      throw AppException.notFound("Book not found: " + bookId);
    }

    List<Review> reviews = reviewRepository.findByBookIdOrderByCreatedAtDesc(bookId);
    return reviews.stream()
        .map(r -> {
          String memberName = memberRepository.findById(r.getMemberId())
              .map(Member::getFullName)
              .orElse("Member");
          return new ReviewDto(r.getId(), memberName, r.getRating(), r.getBody(), r.getCreatedAt());
        })
        .toList();
  }

  public ReviewDto createReview(UUID memberId, UUID bookId, Integer rating, String body) {
    if (rating == null || rating < 1 || rating > 5) {
      throw AppException.validation("rating", "Rating must be between 1 and 5", "RANGE");
    }
    if (body == null || body.trim().isEmpty() || body.length() > 100) {
      throw AppException.validation("body", "Body must be between 1 and 100 characters", "LENGTH");
    }

    Book book = bookRepository.findById(bookId)
        .orElseThrow(() -> AppException.notFound("Book not found: " + bookId));

    if (reviewRepository.existsByMemberIdAndBookId(memberId, bookId)) {
      throw new AppException(ErrorCode.DUPLICATE_REVIEW, "Member has already reviewed this book");
    }

    Member member = memberRepository.findById(memberId)
        .orElseThrow(() -> AppException.notFound("Member not found: " + memberId));

    Review review = new Review(memberId, bookId, rating, body.trim());
    review = reviewRepository.save(review);

    List<Review> allReviews = reviewRepository.findByBookIdOrderByCreatedAtDesc(bookId);
    int count = allReviews.size();
    double avg = allReviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
    BigDecimal roundedAvg = BigDecimal.valueOf(avg).setScale(1, RoundingMode.HALF_UP);

    book.setRating(roundedAvg);
    book.setReviewCount(count);
    bookRepository.save(book);

    return new ReviewDto(review.getId(), member.getFullName(), review.getRating(), review.getBody(), review.getCreatedAt());
  }
}
