package com.bookhaven.shipping.repository;

import com.bookhaven.shipping.entity.Address;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Every query includes the member id: an address is only ever loaded as {@code (id, memberId)}. */
public interface AddressRepository extends JpaRepository<Address, UUID> {

  Optional<Address> findByIdAndMemberIdAndDeletedAtIsNull(UUID id, UUID memberId);

  List<Address> findByMemberIdAndDeletedAtIsNullOrderByCreatedAtAsc(UUID memberId);

  Optional<Address> findByMemberIdAndIsDefaultTrueAndDeletedAtIsNull(UUID memberId);
}
