package com.bookhaven.catalog.service;

import com.bookhaven.catalog.dto.AuthorDto;
import com.bookhaven.catalog.dto.AuthorProfileDto;
import com.bookhaven.catalog.dto.BookSummary;
import com.bookhaven.catalog.entity.Author;
import com.bookhaven.catalog.entity.AuthorFollow;
import com.bookhaven.catalog.entity.Book;
import com.bookhaven.catalog.repository.AuthorFollowRepository;
import com.bookhaven.catalog.repository.AuthorRepository;
import com.bookhaven.catalog.repository.BookRepository;
import com.bookhaven.common.AppException;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthorService {

  private final AuthorRepository authorRepository;
  private final AuthorFollowRepository authorFollowRepository;
  private final BookRepository bookRepository;
  private final CatalogService catalogService;

  public AuthorService(
      AuthorRepository authorRepository,
      AuthorFollowRepository authorFollowRepository,
      BookRepository bookRepository,
      CatalogService catalogService) {
    this.authorRepository = authorRepository;
    this.authorFollowRepository = authorFollowRepository;
    this.bookRepository = bookRepository;
    this.catalogService = catalogService;
  }

  @Transactional(readOnly = true)
  public List<AuthorDto> listAuthors(UUID currentMemberId) {
    List<Author> authors = authorRepository.findAll(Sort.by(Sort.Direction.ASC, "name"));
    Set<UUID> followedIds = currentMemberId != null
        ? authorFollowRepository.findByMemberIdOrderByCreatedAtDesc(currentMemberId)
            .stream()
            .map(AuthorFollow::getAuthorId)
            .collect(Collectors.toSet())
        : Set.of();

    return authors.stream()
        .map(a -> new AuthorDto(
            a.getId(),
            a.getName(),
            a.getSlug(),
            a.getImageUrl(),
            currentMemberId != null ? followedIds.contains(a.getId()) : null))
        .toList();
  }

  @Transactional(readOnly = true)
  public AuthorProfileDto getAuthor(String slug, String pincode, UUID currentMemberId) {
    Author author = authorRepository.findBySlug(slug)
        .orElseThrow(() -> AppException.notFound("Author not found: " + slug));

    boolean following = currentMemberId != null &&
        authorFollowRepository.existsByMemberIdAndAuthorId(currentMemberId, author.getId());

    List<Book> books = bookRepository.findByAuthorIdOrderByBaseSoldCountDesc(author.getId());
    List<BookSummary> bookSummaries = books.stream()
        .map(b -> catalogService.toSummary(b, pincode))
        .toList();

    return new AuthorProfileDto(
        author.getId(),
        author.getName(),
        author.getSlug(),
        author.getImageUrl(),
        following,
        author.getBio(),
        bookSummaries);
  }

  @Transactional(readOnly = true)
  public List<AuthorDto> listFollowing(UUID memberId) {
    List<AuthorFollow> follows = authorFollowRepository.findByMemberIdOrderByCreatedAtDesc(memberId);
    return follows.stream()
        .map(f -> authorRepository.findById(f.getAuthorId()))
        .filter(java.util.Optional::isPresent)
        .map(java.util.Optional::get)
        .map(a -> new AuthorDto(a.getId(), a.getName(), a.getSlug(), a.getImageUrl(), true))
        .toList();
  }

  public void followAuthor(UUID memberId, String authorSlug) {
    Author author = authorRepository.findBySlug(authorSlug)
        .orElseThrow(() -> AppException.notFound("Author not found: " + authorSlug));

    if (!authorFollowRepository.existsByMemberIdAndAuthorId(memberId, author.getId())) {
      authorFollowRepository.save(new AuthorFollow(memberId, author.getId()));
    }
  }

  public void unfollowAuthor(UUID memberId, String authorSlug) {
    Author author = authorRepository.findBySlug(authorSlug)
        .orElseThrow(() -> AppException.notFound("Author not found: " + authorSlug));

    AuthorFollow follow = authorFollowRepository.findByMemberIdAndAuthorId(memberId, author.getId())
        .orElseThrow(() -> AppException.notFound("Not following author: " + authorSlug));

    authorFollowRepository.delete(follow);
  }
}
