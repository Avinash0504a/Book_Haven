package com.bookhaven.catalog.controller;

import com.bookhaven.catalog.dto.AuthorDto;
import com.bookhaven.catalog.dto.FollowRequest;
import com.bookhaven.catalog.service.AuthorService;
import com.bookhaven.common.ApiResponse;
import com.bookhaven.security.CurrentMember;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/following", produces = MediaType.APPLICATION_JSON_VALUE)
public class FollowingController {

  private final AuthorService authorService;
  private final CurrentMember currentMember;

  public FollowingController(AuthorService authorService, CurrentMember currentMember) {
    this.authorService = authorService;
    this.currentMember = currentMember;
  }

  @GetMapping
  public ApiResponse<List<AuthorDto>> listFollowing() {
    return ApiResponse.ok(authorService.listFollowing(currentMember.id()));
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
  public ApiResponse<Void> followAuthor(@Valid @RequestBody FollowRequest request) {
    authorService.followAuthor(currentMember.id(), request.authorSlug());
    return ApiResponse.ok();
  }

  @DeleteMapping("/{slug}")
  public ApiResponse<Void> unfollowAuthor(@PathVariable("slug") String slug) {
    authorService.unfollowAuthor(currentMember.id(), slug);
    return ApiResponse.ok();
  }
}
