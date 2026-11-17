package com.bookhaven.catalog.controller;

import com.bookhaven.catalog.dto.BookPage;
import com.bookhaven.catalog.dto.CategoryDto;
import com.bookhaven.catalog.entity.BookFormat;
import com.bookhaven.catalog.service.CatalogService;
import com.bookhaven.common.ApiResponse;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/categories", produces = MediaType.APPLICATION_JSON_VALUE)
public class CategoryController {

  private final CatalogService catalogService;

  public CategoryController(CatalogService catalogService) {
    this.catalogService = catalogService;
  }

  @GetMapping
  public ApiResponse<List<CategoryDto>> listCategories() {
    return ApiResponse.ok(catalogService.listCategories());
  }

  @GetMapping("/{slug}/products")
  public ApiResponse<BookPage> listCategoryBooks(
      @PathVariable("slug") String slug,
      @RequestParam(name = "page", required = false) Integer page,
      @RequestParam(name = "limit", required = false) Integer limit,
      @RequestParam(name = "sort", required = false) String sort,
      @RequestParam(name = "search", required = false) String search,
      @RequestParam(name = "language", required = false) String language,
      @RequestParam(name = "format", required = false) BookFormat format,
      @RequestParam(name = "price", required = false) String price,
      @RequestParam(name = "pincode", required = false) String pincode) {

    return ApiResponse.ok(
        catalogService.listCategoryBooks(slug, page, limit, sort, search, language, format, price, pincode));
  }
}
