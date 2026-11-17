package com.bookhaven.order.service;

import com.bookhaven.catalog.dto.BookSummary;
import com.bookhaven.catalog.entity.Book;
import com.bookhaven.catalog.entity.BookFormat;
import com.bookhaven.catalog.repository.BookRepository;
import com.bookhaven.catalog.service.CatalogService;
import com.bookhaven.common.AppException;
import com.bookhaven.order.dto.LibraryEntry;
import com.bookhaven.order.dto.ReaderChapter;
import com.bookhaven.order.dto.ReaderContent;
import com.bookhaven.order.entity.Order;
import com.bookhaven.order.entity.OrderItem;
import com.bookhaven.order.entity.OrderStatus;
import com.bookhaven.order.repository.OrderItemRepository;
import com.bookhaven.order.repository.OrderRepository;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class LibraryService {

  private static final Set<OrderStatus> ACTIVE_STATUSES = Set.of(
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED);

  private final OrderRepository orderRepository;
  private final OrderItemRepository orderItemRepository;
  private final BookRepository bookRepository;
  private final CatalogService catalogService;

  public LibraryService(
      OrderRepository orderRepository,
      OrderItemRepository orderItemRepository,
      BookRepository bookRepository,
      CatalogService catalogService) {
    this.orderRepository = orderRepository;
    this.orderItemRepository = orderItemRepository;
    this.bookRepository = bookRepository;
    this.catalogService = catalogService;
  }

  public List<LibraryEntry> listLibrary(UUID memberId) {
    List<Order> orders = orderRepository.findByMemberIdOrderByCreatedAtDesc(memberId);
    List<LibraryEntry> result = new ArrayList<>();
    Set<UUID> seenBookIds = new HashSet<>();

    for (Order order : orders) {
      if (!ACTIVE_STATUSES.contains(order.getStatus())) {
        continue;
      }

      List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
      for (OrderItem item : items) {
        if (item.getQuantity() - item.getCancelledQuantity() <= 0) {
          continue;
        }

        String format = item.getFormatSnapshot();
        if (!"EBOOK".equalsIgnoreCase(format) && !"AUDIOBOOK".equalsIgnoreCase(format)) {
          continue;
        }

        if (seenBookIds.add(item.getBookId())) {
          bookRepository.findById(item.getBookId()).ifPresent(book -> {
            BookSummary summary = catalogService.toSummary(book, null);
            result.add(new LibraryEntry(summary, order.getId(), order.getCreatedAt()));
          });
        }
      }
    }

    return result;
  }

  public ReaderContent readLibraryBook(UUID memberId, UUID bookId) {
    Book book = checkOwnership(memberId, bookId);
    if (book.getFormat() != BookFormat.EBOOK) {
      throw AppException.notFound("Not an eBook: " + bookId);
    }

    List<ReaderChapter> chapters = List.of(
        new ReaderChapter("Introduction", "Welcome to " + book.getTitle() + ".\n\n" + (book.getDescription() != null ? book.getDescription() : "")),
        new ReaderChapter("Chapter 1: The Beginning", "This is the complete digital edition of " + book.getTitle() + " by " + (book.getAuthor() != null ? book.getAuthor().getName() : "Author") + ".\n\nEnjoy reading your Book Haven digital purchase."),
        new ReaderChapter("Chapter 2: Insights", "Continuing with the core narrative of " + book.getTitle() + "...\n\n" + (book.getDescription() != null ? book.getDescription() : "")),
        new ReaderChapter("Conclusion", "Thank you for reading " + book.getTitle() + " on Book Haven E-Library.")
    );

    return new ReaderContent(book.getTitle(), chapters);
  }

  public byte[] streamLibraryAudio(UUID memberId, UUID bookId) {
    Book book = checkOwnership(memberId, bookId);
    if (book.getFormat() != BookFormat.AUDIOBOOK) {
      throw AppException.notFound("Not an audiobook: " + bookId);
    }

    return generateWavAudio();
  }

  public byte[] downloadLibraryBook(UUID memberId, UUID bookId) {
    Book book = checkOwnership(memberId, bookId);
    if (book.getFormat() != BookFormat.EBOOK && book.getFormat() != BookFormat.AUDIOBOOK) {
      throw AppException.notFound("Not a digital book: " + bookId);
    }

    if (book.getFormat() == BookFormat.AUDIOBOOK) {
      return generateWavAudio();
    } else {
      String content = "# " + book.getTitle() + "\n\nAuthor: " +
          (book.getAuthor() != null ? book.getAuthor().getName() : "") + "\n\n" +
          (book.getDescription() != null ? book.getDescription() : "");
      return content.getBytes(StandardCharsets.UTF_8);
    }
  }

  public String getDownloadFilename(UUID memberId, UUID bookId) {
    Book book = checkOwnership(memberId, bookId);
    String ext = book.getFormat() == BookFormat.AUDIOBOOK ? ".wav" : ".epub";
    return book.getSlug() + ext;
  }

  private Book checkOwnership(UUID memberId, UUID bookId) {
    Book book = bookRepository.findById(bookId)
        .orElseThrow(() -> AppException.notFound("Book not found: " + bookId));

    if (book.getFormat() != BookFormat.EBOOK && book.getFormat() != BookFormat.AUDIOBOOK) {
      throw AppException.forbidden("Book is not a digital item");
    }

    List<Order> orders = orderRepository.findByMemberIdOrderByCreatedAtDesc(memberId);
    boolean hasPurchased = false;

    for (Order order : orders) {
      if (!ACTIVE_STATUSES.contains(order.getStatus())) {
        continue;
      }
      List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
      for (OrderItem item : items) {
        if (item.getBookId().equals(bookId) && (item.getQuantity() - item.getCancelledQuantity() > 0)) {
          hasPurchased = true;
          break;
        }
      }
      if (hasPurchased) {
        break;
      }
    }

    if (!hasPurchased) {
      throw AppException.forbidden("Member has not purchased this digital book");
    }

    return book;
  }

  private byte[] generateWavAudio() {
    // Generate 1-second 8000Hz 8-bit mono PCM tone/silence WAV
    int sampleRate = 8000;
    int numSamples = sampleRate; // 1 second
    byte[] data = new byte[numSamples];
    for (int i = 0; i < numSamples; i++) {
      data[i] = (byte) (128 + 40 * Math.sin(2 * Math.PI * 440 * i / sampleRate));
    }

    int totalDataLen = numSamples;
    int totalLength = totalDataLen + 36;

    ByteArrayOutputStream out = new ByteArrayOutputStream();
    try {
      out.write(new byte[] {'R', 'I', 'F', 'F'});
      out.write(intToByteArray(totalLength));
      out.write(new byte[] {'W', 'A', 'V', 'E'});
      out.write(new byte[] {'f', 'm', 't', ' '});
      out.write(intToByteArray(16)); // SubChunk1Size (16 for PCM)
      out.write(shortToByteArray((short) 1)); // AudioFormat (1 for PCM)
      out.write(shortToByteArray((short) 1)); // NumChannels (1 mono)
      out.write(intToByteArray(sampleRate)); // SampleRate
      out.write(intToByteArray(sampleRate)); // ByteRate (sampleRate * numChannels * bitsPerSample/8)
      out.write(shortToByteArray((short) 1)); // BlockAlign
      out.write(shortToByteArray((short) 8)); // BitsPerSample
      out.write(new byte[] {'d', 'a', 't', 'a'});
      out.write(intToByteArray(totalDataLen));
      out.write(data);
    } catch (Exception e) {
      // ignore
    }
    return out.toByteArray();
  }

  private byte[] intToByteArray(int value) {
    return new byte[] {
        (byte) (value & 0xff),
        (byte) ((value >> 8) & 0xff),
        (byte) ((value >> 16) & 0xff),
        (byte) ((value >> 24) & 0xff)
    };
  }

  private byte[] shortToByteArray(short value) {
    return new byte[] {
        (byte) (value & 0xff),
        (byte) ((value >> 8) & 0xff)
    };
  }
}
