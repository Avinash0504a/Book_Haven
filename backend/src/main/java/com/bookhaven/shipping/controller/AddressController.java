package com.bookhaven.shipping.controller;

import com.bookhaven.common.ApiResponse;
import com.bookhaven.security.CurrentMember;
import com.bookhaven.shipping.dto.AddressDto;
import com.bookhaven.shipping.dto.AddressRequest;
import com.bookhaven.shipping.service.AddressService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/addresses", produces = MediaType.APPLICATION_JSON_VALUE)
public class AddressController {

  private final AddressService addressService;
  private final CurrentMember currentMember;

  public AddressController(AddressService addressService, CurrentMember currentMember) {
    this.addressService = addressService;
    this.currentMember = currentMember;
  }

  @GetMapping
  public ApiResponse<List<AddressDto>> listAddresses() {
    return ApiResponse.ok(addressService.listAddresses(currentMember.id()));
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
  public ApiResponse<AddressDto> createAddress(@Valid @RequestBody AddressRequest request) {
    return ApiResponse.ok(addressService.createAddress(currentMember.id(), request));
  }

  @PatchMapping(path = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ApiResponse<AddressDto> updateAddress(
      @PathVariable("id") UUID id,
      @Valid @RequestBody AddressRequest request) {
    return ApiResponse.ok(addressService.updateAddress(currentMember.id(), id, request));
  }

  @DeleteMapping("/{id}")
  public ApiResponse<Void> deleteAddress(@PathVariable("id") UUID id) {
    addressService.deleteAddress(currentMember.id(), id);
    return ApiResponse.ok();
  }
}
