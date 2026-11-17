package com.bookhaven.catalog.controller;

import com.bookhaven.catalog.dto.BookPage;
import com.bookhaven.catalog.dto.BrandDto;
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
@RequestMapping(path = "/api/brands", produces = MediaType.APPLICATION_JSON_VALUE)
public class BrandController {

  private final CatalogService catalogService;

  public BrandController(CatalogService catalogService) {
    this.catalogService = catalogService;
  }

  @GetMapping
  public ApiResponse<List<BrandDto>> listBrands() {
    return ApiResponse.ok(catalogService.listBrands());
  }

  @GetMapping("/{slug}/products")
  public ApiResponse<BookPage> listBrandBooks(
      @PathVariable("slug") String slug,
      @RequestParam(name = "page", required = false) Integer page,
      @RequestParam(name = "limit", required = false) Integer limit,
      @RequestParam(name = "sort", required = false) String sort,
      @RequestParam(name = "category", required = false) String category,
      @RequestParam(name = "search", required = false) String search,
      @RequestParam(name = "language", required = false) String language,
      @RequestParam(name = "format", required = false) BookFormat format,
      @RequestParam(name = "price", required = false) String price,
      @RequestParam(name = "pincode", required = false) String pincode) {

    return ApiResponse.ok(
        catalogService.listBrandBooks(slug, page, limit, sort, category, search, language, format, price, pincode));
  }
}
