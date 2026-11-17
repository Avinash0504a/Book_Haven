package com.bookhaven.catalog.controller;

import com.bookhaven.catalog.dto.BookDetail;
import com.bookhaven.catalog.dto.BookPage;
import com.bookhaven.catalog.dto.BookSummary;
import com.bookhaven.catalog.entity.BookFormat;
import com.bookhaven.catalog.service.CatalogService;
import com.bookhaven.common.ApiResponse;
import com.bookhaven.security.CurrentMember;
import java.util.List;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/products", produces = MediaType.APPLICATION_JSON_VALUE)
public class BookController {

  private final CatalogService catalogService;
  private final CurrentMember currentMember;

  public BookController(CatalogService catalogService, CurrentMember currentMember) {
    this.catalogService = catalogService;
    this.currentMember = currentMember;
  }

  @GetMapping
  public ApiResponse<BookPage> listBooks(
      @RequestParam(name = "page", required = false) Integer page,
      @RequestParam(name = "limit", required = false) Integer limit,
      @RequestParam(name = "sort", required = false) String sort,
      @RequestParam(name = "category", required = false) String category,
      @RequestParam(name = "brand", required = false) String brand,
      @RequestParam(name = "search", required = false) String search,
      @RequestParam(name = "language", required = false) String language,
      @RequestParam(name = "format", required = false) BookFormat format,
      @RequestParam(name = "price", required = false) String price,
      @RequestParam(name = "pincode", required = false) String pincode) {

    return ApiResponse.ok(
        catalogService.listBooks(page, limit, sort, category, brand, search, language, format, price, pincode));
  }

  @GetMapping("/{id}")
  public ApiResponse<BookDetail> getBook(
      @PathVariable("id") UUID id,
      @RequestParam(name = "pincode", required = false) String pincode) {

    UUID memberId = currentMember.find().orElse(null);
    return ApiResponse.ok(catalogService.getBook(id, pincode, memberId));
  }

  @GetMapping("/{id}/related")
  public ApiResponse<List<BookSummary>> relatedBooks(
      @PathVariable("id") UUID id,
      @RequestParam(name = "pincode", required = false) String pincode) {

    return ApiResponse.ok(catalogService.relatedBooks(id, pincode));
  }

  @PostMapping("/{id}/notify-me")
  public ApiResponse<Void> notifyMe(@PathVariable("id") UUID id) {
    catalogService.notifyMe(currentMember.id(), id);
    return ApiResponse.ok();
  }
}
