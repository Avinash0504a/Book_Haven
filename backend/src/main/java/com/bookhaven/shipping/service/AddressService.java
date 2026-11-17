package com.bookhaven.shipping.service;

import com.bookhaven.common.AppException;
import com.bookhaven.shipping.dto.AddressDto;
import com.bookhaven.shipping.dto.AddressRequest;
import com.bookhaven.shipping.entity.Address;
import com.bookhaven.shipping.repository.AddressRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AddressService {

  private final AddressRepository addressRepository;

  public AddressService(AddressRepository addressRepository) {
    this.addressRepository = addressRepository;
  }

  @Transactional(readOnly = true)
  public List<AddressDto> listAddresses(UUID memberId) {
    return addressRepository.findByMemberIdAndDeletedAtIsNullOrderByCreatedAtAsc(memberId).stream()
        .map(this::toDto)
        .toList();
  }

  public AddressDto createAddress(UUID memberId, AddressRequest request) {
    List<Address> existing = addressRepository.findByMemberIdAndDeletedAtIsNullOrderByCreatedAtAsc(memberId);
    boolean isDefault = existing.isEmpty() || Boolean.TRUE.equals(request.isDefault());

    if (isDefault && !existing.isEmpty()) {
      clearExistingDefault(memberId);
    }

    Address address = new Address(
        memberId,
        request.label(),
        request.recipientName(),
        request.phone(),
        request.line1(),
        request.line2(),
        request.city(),
        request.state(),
        request.postalCode(),
        request.country(),
        isDefault,
        Instant.now());

    Address saved = addressRepository.save(address);
    return toDto(saved);
  }

  public AddressDto updateAddress(UUID memberId, UUID addressId, AddressRequest request) {
    Address address = addressRepository.findByIdAndMemberIdAndDeletedAtIsNull(addressId, memberId)
        .orElseThrow(() -> AppException.notFound("Address not found: " + addressId));

    boolean newDefault = Boolean.TRUE.equals(request.isDefault());
    if (newDefault && !address.isDefault()) {
      clearExistingDefault(memberId);
      address.setDefault(true);
    }

    address.setLabel(request.label());
    address.setRecipientName(request.recipientName());
    address.setPhone(request.phone());
    address.setLine1(request.line1());
    address.setLine2(request.line2());
    address.setCity(request.city());
    address.setState(request.state());
    address.setPostalCode(request.postalCode());
    if (request.country() != null && !request.country().isBlank()) {
      address.setCountry(request.country());
    }

    Address saved = addressRepository.save(address);
    return toDto(saved);
  }

  public void deleteAddress(UUID memberId, UUID addressId) {
    Address address = addressRepository.findByIdAndMemberIdAndDeletedAtIsNull(addressId, memberId)
        .orElseThrow(() -> AppException.notFound("Address not found: " + addressId));

    address.setDeletedAt(Instant.now());
    address.setDefault(false);
    addressRepository.save(address);
  }

  private void clearExistingDefault(UUID memberId) {
    Optional<Address> currentDefault = addressRepository.findByMemberIdAndIsDefaultTrueAndDeletedAtIsNull(memberId);
    currentDefault.ifPresent(addr -> {
      addr.setDefault(false);
      addressRepository.save(addr);
    });
  }

  public AddressDto toDto(Address a) {
    return new AddressDto(
        a.getId(),
        a.getLabel(),
        a.getRecipientName(),
        a.getPhone(),
        a.getLine1(),
        a.getLine2(),
        a.getCity(),
        a.getState(),
        a.getPostalCode(),
        a.getCountry(),
        a.isDefault());
  }
}
