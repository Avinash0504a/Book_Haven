package com.bookhaven.order.controller;

import com.bookhaven.common.ApiResponse;
import com.bookhaven.order.dto.LibraryEntry;
import com.bookhaven.order.dto.ReaderContent;
import com.bookhaven.order.service.LibraryService;
import com.bookhaven.security.CurrentMember;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/library")
public class LibraryController {

  private final LibraryService libraryService;
  private final CurrentMember currentMember;

  public LibraryController(LibraryService libraryService, CurrentMember currentMember) {
    this.libraryService = libraryService;
    this.currentMember = currentMember;
  }

  @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
  public ApiResponse<List<LibraryEntry>> listLibrary() {
    return ApiResponse.ok(libraryService.listLibrary(currentMember.id()));
  }

  @GetMapping(path = "/{bookId}/content", produces = MediaType.APPLICATION_JSON_VALUE)
  public ApiResponse<ReaderContent> readLibraryBook(@PathVariable("bookId") UUID bookId) {
    return ApiResponse.ok(libraryService.readLibraryBook(currentMember.id(), bookId));
  }

  @GetMapping(path = "/{bookId}/audio", produces = "audio/wav")
  public ResponseEntity<byte[]> streamLibraryAudio(@PathVariable("bookId") UUID bookId) {
    byte[] audio = libraryService.streamLibraryAudio(currentMember.id(), bookId);
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType("audio/wav"))
        .body(audio);
  }

  @GetMapping(path = "/{bookId}/download", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
  public ResponseEntity<byte[]> downloadLibraryBook(@PathVariable("bookId") UUID bookId) {
    byte[] file = libraryService.downloadLibraryBook(currentMember.id(), bookId);
    String filename = libraryService.getDownloadFilename(currentMember.id(), bookId);
    return ResponseEntity.ok()
        .contentType(MediaType.APPLICATION_OCTET_STREAM)
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
        .body(file);
  }
}
