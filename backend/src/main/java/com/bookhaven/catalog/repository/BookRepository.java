package com.bookhaven.catalog.repository;

import com.bookhaven.catalog.entity.Book;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookRepository extends JpaRepository<Book, UUID>, JpaSpecificationExecutor<Book> {

  Optional<Book> findBySlug(String slug);

  java.util.List<Book> findByAuthorIdOrderByBaseSoldCountDesc(UUID authorId);

  @Modifying
  @Query("UPDATE Book b SET b.stockQuantity = b.stockQuantity - :qty WHERE b.id = :id AND b.stockQuantity >= :qty")
  int decrementStockIfAvailable(@Param("id") UUID id, @Param("qty") int qty);

  @Modifying
  @Query("UPDATE Book b SET b.stockQuantity = b.stockQuantity + :qty WHERE b.id = :id")
  int incrementStock(@Param("id") UUID id, @Param("qty") int qty);
}
