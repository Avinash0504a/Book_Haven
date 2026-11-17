package com.bookhaven.catalog.controller;

import com.bookhaven.catalog.dto.AuthorDto;
import com.bookhaven.catalog.dto.AuthorProfileDto;
import com.bookhaven.catalog.service.AuthorService;
import com.bookhaven.common.ApiResponse;
import com.bookhaven.security.CurrentMember;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/authors", produces = MediaType.APPLICATION_JSON_VALUE)
public class AuthorController {

  private final AuthorService authorService;
  private final CurrentMember currentMember;

  public AuthorController(AuthorService authorService, CurrentMember currentMember) {
    this.authorService = authorService;
    this.currentMember = currentMember;
  }

  @GetMapping
  public ApiResponse<List<AuthorDto>> listAuthors() {
    return ApiResponse.ok(authorService.listAuthors(currentMember.find().orElse(null)));
  }

  @GetMapping("/{slug}")
  public ApiResponse<AuthorProfileDto> getAuthor(
      @PathVariable("slug") String slug,
      @RequestParam(name = "pincode", required = false) String pincode) {
    return ApiResponse.ok(authorService.getAuthor(slug, pincode, currentMember.find().orElse(null)));
  }
}
