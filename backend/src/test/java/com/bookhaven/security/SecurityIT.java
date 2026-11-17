package com.bookhaven.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bookhaven.support.IntegrationTestBase;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

/** FR-004: the public list is exactly register, login, logout, catalogue reads, recommendations, delivery estimate, covers. */
class SecurityIT extends IntegrationTestBase {

  /** Written independently of production code: this is the spec's list. */
  private record Route(HttpMethod method, String path) {}

  private static final List<Route> PUBLIC =
      List.of(
          new Route(HttpMethod.POST, "/api/auth/register"),
          new Route(HttpMethod.POST, "/api/auth/login"),
          new Route(HttpMethod.POST, "/api/auth/logout"),
          new Route(HttpMethod.GET, "/api/categories"),
          new Route(HttpMethod.GET, "/api/categories/romance/products"),
          new Route(HttpMethod.GET, "/api/brands"),
          new Route(HttpMethod.GET, "/api/brands/lantern-press/products"),
          new Route(HttpMethod.GET, "/api/products"),
          new Route(HttpMethod.GET, "/api/products/00000000-0000-0000-0000-000000000001"),
          new Route(HttpMethod.GET, "/api/products/00000000-0000-0000-0000-000000000001/related"),
          new Route(HttpMethod.GET, "/api/products/00000000-0000-0000-0000-000000000001/reviews"),
          new Route(HttpMethod.GET, "/api/recommendations"),
          new Route(HttpMethod.GET, "/api/delivery/estimate"),
          new Route(HttpMethod.GET, "/api/authors"),
          new Route(HttpMethod.GET, "/api/authors/arjun-patel"),
          new Route(HttpMethod.GET, "/covers/the-lost-kitten.svg"));

  private static final List<Route> PROTECTED =
      List.of(
          new Route(HttpMethod.GET, "/api/auth/me"),
          new Route(HttpMethod.PATCH, "/api/auth/me"),
          new Route(HttpMethod.GET, "/api/auth/points-history"),
          new Route(HttpMethod.GET, "/api/cart"),
          new Route(HttpMethod.DELETE, "/api/cart"),
          new Route(HttpMethod.POST, "/api/cart/items"),
          new Route(HttpMethod.PATCH, "/api/cart/items/" + UUID.randomUUID()),
          new Route(HttpMethod.GET, "/api/addresses"),
          new Route(HttpMethod.POST, "/api/products/" + UUID.randomUUID() + "/notify-me"),
          new Route(HttpMethod.POST, "/api/products/" + UUID.randomUUID() + "/reviews"),
          new Route(HttpMethod.POST, "/api/checkout/order"),
          new Route(HttpMethod.GET, "/api/orders"),
          new Route(HttpMethod.GET, "/api/wallet"),
          new Route(HttpMethod.GET, "/api/wishlist"),
          new Route(HttpMethod.GET, "/api/following"),
          new Route(HttpMethod.GET, "/api/library"),
          new Route(HttpMethod.GET, "/api/not-a-route-at-all"));

  @Autowired MockMvc mvc;
  @Autowired JwtService jwtService;
  @Autowired RequestMappingHandlerMapping handlerMapping;

  @Test
  void protectedRouteWithoutTokenIs401() throws Exception {
    mvc.perform(get("/api/auth/me"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
  }

  @Test
  void badTokensAre401() throws Exception {
    String valid = jwtService.issue(UUID.randomUUID());
    for (String header :
        new String[] {"Bearer garbage", "Bearer " + valid + "x", "Basic " + valid, "Bearer "}) {
      mvc.perform(get("/api/auth/me").header("Authorization", header))
          .andExpect(status().isUnauthorized())
          .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }
  }

  @Test
  void publicRoutesNeedNoToken() throws Exception {
    for (Route route : PUBLIC) {
      int code =
          mvc.perform(request(route.method(), route.path())).andReturn().getResponse().getStatus();
      assertThat(code).as("%s %s", route.method(), route.path()).isNotIn(401, 403);
    }
  }

  @Test
  void everyOtherRouteNeedsToken() throws Exception {
    for (Route route : PROTECTED) {
      int code =
          mvc.perform(request(route.method(), route.path())).andReturn().getResponse().getStatus();
      assertThat(code).as("%s %s", route.method(), route.path()).isEqualTo(401);
    }
  }

  /** Walks every real /api route in the application, so a new route cannot be left open by accident. */
  @Test
  void everyMappedRouteOutsideThePublicListNeedsToken() throws Exception {
    Set<String> publicKeys = new java.util.HashSet<>();
    PUBLIC.forEach(r -> publicKeys.add(r.method() + " " + normalise(r.path())));

    List<String> leaks = new ArrayList<>();
    for (RequestMappingInfo info : handlerMapping.getHandlerMethods().keySet()) {
      if (info.getPathPatternsCondition() == null) {
        continue;
      }
      for (var pattern : info.getPathPatternsCondition().getPatterns()) {
        String raw = pattern.getPatternString();
        if (!raw.startsWith("/api/")) {
          continue;
        }
        String concrete = raw.replaceAll("\\{[^}]+}", UUID.randomUUID().toString());
        for (RequestMethod method : info.getMethodsCondition().getMethods()) {
          boolean isPublic = isPublic(method.name(), raw);
          MvcResult result =
              mvc.perform(request(HttpMethod.valueOf(method.name()), concrete)).andReturn();
          int code = result.getResponse().getStatus();
          if (!isPublic && code != 401) {
            leaks.add(method + " " + raw + " -> " + code);
          }
          if (isPublic && code == 401) {
            leaks.add("public route is blocked: " + method + " " + raw);
          }
        }
      }
    }
    assertThat(leaks).isEmpty();
    assertThat(publicKeys).isNotEmpty();
  }

  @Test
  void validTokenPassesSecurity() throws Exception {
    String token = jwtService.issue(UUID.randomUUID());

    // Security lets the request through; the route does not exist, so the handler says 404.
    mvc.perform(get("/api/not-a-route-at-all").header("Authorization", "Bearer " + token))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("NOT_FOUND"));
  }

  @Test
  void securityHeadersAreSent() throws Exception {
    mvc.perform(get("/api/auth/me"))
        .andExpect(
            result ->
                assertThat(result.getResponse().getHeader("X-Content-Type-Options"))
                    .isEqualTo("nosniff"));
  }

  private static String normalise(String path) {
    return path;
  }

  /** Matches a mapped pattern against the spec's public list. */
  private static boolean isPublic(String method, String pattern) {
    String p = pattern.replaceAll("\\{[^}]+}", "X");
    for (Route route : PUBLIC) {
      String r = route.path().replaceAll("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", "X");
      r = r.replaceAll("/(romance|lantern-press|arjun-patel)(/|$)", "/X$2");
      if (route.method().name().equals(method) && r.equals(p)) {
        return true;
      }
    }
    return false;
  }
}
