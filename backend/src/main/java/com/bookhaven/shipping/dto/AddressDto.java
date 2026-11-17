package com.bookhaven.shipping.dto;

import com.bookhaven.shipping.entity.AddressLabel;
import java.util.UUID;

public record AddressDto(
    UUID id,
    AddressLabel label,
    String recipientName,
    String phone,
    String line1,
    String line2,
    String city,
    String state,
    String postalCode,
    String country,
    boolean isDefault) {}
