package com.bookhaven.common;

/** One entry of {@code data.fieldErrors[]}: JSON path, human message and a stable reason. */
public record FieldError(String field, String message, String reason) {}
