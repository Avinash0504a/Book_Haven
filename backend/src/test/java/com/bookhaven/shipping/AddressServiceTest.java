package com.bookhaven.shipping;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bookhaven.common.AppException;
import com.bookhaven.shipping.dto.AddressDto;
import com.bookhaven.shipping.dto.AddressRequest;
import com.bookhaven.shipping.entity.Address;
import com.bookhaven.shipping.entity.AddressLabel;
import com.bookhaven.shipping.repository.AddressRepository;
import com.bookhaven.shipping.service.AddressService;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AddressServiceTest {

  @Mock private AddressRepository addressRepository;

  private AddressService addressService;

  @BeforeEach
  void setUp() {
    addressService = new AddressService(addressRepository);
  }

  @Test
  void firstBecomesDefault() {
    UUID memberId = UUID.randomUUID();
    when(addressRepository.findByMemberIdAndDeletedAtIsNullOrderByCreatedAtAsc(memberId))
        .thenReturn(List.of());

    AddressRequest req = new AddressRequest(
        AddressLabel.HOME, "John Doe", "9876543210", "123 Street", "Apt 4", "Bangalore", "Karnataka", "560001", "India", false);

    when(addressRepository.save(any(Address.class))).thenAnswer(inv -> inv.getArgument(0));

    AddressDto result = addressService.createAddress(memberId, req);

    ArgumentCaptor<Address> captor = ArgumentCaptor.forClass(Address.class);
    verify(addressRepository).save(captor.capture());
    assertThat(captor.getValue().isDefault()).isTrue();
    assertThat(result.isDefault()).isTrue();
  }

  @Test
  void newDefaultClearsOld() {
    UUID memberId = UUID.randomUUID();
    Address oldDefault = new Address(
        memberId, AddressLabel.HOME, "John", "9876543210", "Line 1", null, "Bangalore", "Karnataka", "560001", "India", true, Instant.now());

    when(addressRepository.findByMemberIdAndDeletedAtIsNullOrderByCreatedAtAsc(memberId))
        .thenReturn(List.of(oldDefault));
    when(addressRepository.findByMemberIdAndIsDefaultTrueAndDeletedAtIsNull(memberId))
        .thenReturn(Optional.of(oldDefault));
    when(addressRepository.save(any(Address.class))).thenAnswer(inv -> inv.getArgument(0));

    AddressRequest req = new AddressRequest(
        AddressLabel.OFFICE, "John Office", "9876543210", "Tech Park", null, "Bangalore", "Karnataka", "560001", "India", true);

    AddressDto result = addressService.createAddress(memberId, req);

    assertThat(oldDefault.isDefault()).isFalse();
    assertThat(result.isDefault()).isTrue();
  }

  @Test
  void deleteIsSoft() {
    UUID memberId = UUID.randomUUID();
    UUID addressId = UUID.randomUUID();
    Address addr = new Address(
        memberId, AddressLabel.HOME, "John", "9876543210", "Line 1", null, "Bangalore", "Karnataka", "560001", "India", true, Instant.now());

    when(addressRepository.findByIdAndMemberIdAndDeletedAtIsNull(addressId, memberId))
        .thenReturn(Optional.of(addr));

    addressService.deleteAddress(memberId, addressId);

    assertThat(addr.getDeletedAt()).isNotNull();
    assertThat(addr.isDefault()).isFalse();
    verify(addressRepository).save(addr);
  }

  @Test
  void loadsByIdAndMemberOnly() {
    UUID memberId = UUID.randomUUID();
    UUID addressId = UUID.randomUUID();

    when(addressRepository.findByIdAndMemberIdAndDeletedAtIsNull(addressId, memberId))
        .thenReturn(Optional.empty());

    AddressRequest req = new AddressRequest(
        AddressLabel.HOME, "John", "9876543210", "Line 1", null, "Bangalore", "Karnataka", "560001", "India", false);

    assertThatThrownBy(() -> addressService.updateAddress(memberId, addressId, req))
        .isInstanceOf(AppException.class)
        .hasMessageContaining("Address not found");
  }
}
