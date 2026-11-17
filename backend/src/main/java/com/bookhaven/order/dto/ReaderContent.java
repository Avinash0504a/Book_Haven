package com.bookhaven.order.dto;

import java.util.List;

public record ReaderContent(String title, List<ReaderChapter> chapters) {}
