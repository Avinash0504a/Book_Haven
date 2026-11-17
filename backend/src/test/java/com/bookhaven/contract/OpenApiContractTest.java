package com.bookhaven.contract;

import static org.assertj.core.api.Assertions.assertThat;

import com.bookhaven.common.ErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import java.io.IOException;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.http.HttpStatus;
import org.springframework.util.ClassUtils;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

/**
 * Constitution principle I: the handwritten {@code openapi.yaml} is the source of truth, and the
 * build fails on any drift. Routes are read from the controllers by reflection, so this test
 * needs no database.
 */
class OpenApiContractTest {

  /** The one place the contract path is written. */
  static final Path OPENAPI = Path.of("..", "specs", "001-book-haven-bookstore", "contracts", "openapi.yaml");

  static final Path SPEC = Path.of("..", "specs", "001-book-haven-bookstore", "spec.md");

  private static final Set<String> METHODS = Set.of("get", "post", "put", "patch", "delete");

  /**
   * Operations not built yet. Each later phase removes its operations; the list must be empty at
   * T123. An entry that exists in code fails the test, so the list cannot go stale.
   */
  static final Set<String> NOT_YET_BUILT = Set.of();

  private static final ObjectMapper YAML = new ObjectMapper(new YAMLFactory());

  /** One operation of the spec. */
  record Operation(String method, String path, String operationId, JsonNode node) {
    String key() {
      return method + " " + path;
    }
  }

  // ------------------------------------------------------------------ the checks

  @Test
  void everyRouteIsInTheSpecAndViceVersa() throws IOException {
    assertThat(routeDrift(readSpec(OPENAPI), codeRoutes())).isEmpty();
  }

  /** Describes every disagreement between the spec and the routes found in code. */
  static List<String> routeDrift(JsonNode spec, Set<String> inCode) {
    List<Operation> operations = operations(spec);
    Set<String> inSpec = operations.stream().map(Operation::key).collect(Collectors.toCollection(TreeSet::new));
    Set<String> notBuilt =
        operations.stream().filter(o -> NOT_YET_BUILT.contains(o.operationId())).map(Operation::key)
            .collect(Collectors.toCollection(TreeSet::new));

    List<String> problems = new ArrayList<>();
    for (String route : new TreeSet<>(inCode)) {
      if (!inSpec.contains(route)) {
        problems.add("in code but not in openapi.yaml: " + route);
      }
    }
    for (String route : inSpec) {
      if (!inCode.contains(route) && !notBuilt.contains(route)) {
        problems.add("in openapi.yaml but not in code (and not on the allow-list): " + route);
      }
    }
    for (String route : notBuilt) {
      if (inCode.contains(route)) {
        problems.add("on the allow-list but now built, remove it: " + route);
      }
    }
    Set<String> specIds = operations.stream().map(Operation::operationId).collect(Collectors.toSet());
    for (String id : new TreeSet<>(NOT_YET_BUILT)) {
      if (!specIds.contains(id)) {
        problems.add("allow-list names an operation that is not in the spec: " + id);
      }
    }
    return problems;
  }

  @Test
  void everyRefResolves() throws IOException {
    assertThat(unresolvedRefs(readSpec(OPENAPI))).as("unresolved $ref").isEmpty();
  }

  @Test
  void everyOperationHasRequiredMetadata() throws IOException {
    List<String> problems = new ArrayList<>();
    for (Operation op : operations(readSpec(OPENAPI))) {
      for (String field : List.of("operationId", "summary", "x-requirements", "x-tier")) {
        JsonNode value = op.node().get(field);
        if (value == null || (value.isTextual() && value.asText().isBlank()) || (value.isArray() && value.isEmpty())) {
          problems.add(op.key() + " lacks " + field);
        }
      }
    }
    assertThat(problems).isEmpty();
  }

  @Test
  void everyRequirementIdExistsInTheSpec() throws IOException {
    Set<String> known = requirementIds(SPEC);
    assertThat(known).as("FR ids read from spec.md").hasSizeGreaterThan(60);

    List<String> unknown = new ArrayList<>();
    for (Operation op : operations(readSpec(OPENAPI))) {
      for (JsonNode id : op.node().path("x-requirements")) {
        if (!known.contains(id.asText())) {
          unknown.add(op.key() + " cites " + id.asText());
        }
      }
    }
    assertThat(unknown).isEmpty();
  }

  @Test
  void operationIdsAreUnique() throws IOException {
    List<String> ids = operations(readSpec(OPENAPI)).stream().map(Operation::operationId).toList();
    assertThat(ids).doesNotHaveDuplicates();
  }

  /** The error codes and statuses in code are exactly the ones the spec documents. */
  @Test
  void errorCodesInCodeMatchSpec() throws IOException {
    JsonNode spec = readSpec(OPENAPI);

    Set<String> specCodes = new TreeSet<>();
    spec.at("/components/schemas/ErrorCode/enum").forEach(n -> specCodes.add(n.asText()));
    Set<String> codeCodes = Arrays.stream(ErrorCode.values()).map(Enum::name).collect(Collectors.toCollection(TreeSet::new));
    assertThat(codeCodes).as("ErrorCode enum vs openapi.yaml ErrorCode").isEqualTo(specCodes);

    Set<Integer> codeStatuses =
        Arrays.stream(ErrorCode.values()).map(c -> c.status().value()).collect(Collectors.toCollection(TreeSet::new));
    assertThat(codeStatuses).containsExactlyInAnyOrder(400, 401, 402, 403, 404, 409, 500);

    Set<Integer> specStatuses = new TreeSet<>();
    for (Operation op : operations(spec)) {
      for (Map.Entry<String, JsonNode> response : op.node().path("responses").properties()) {
        if (!response.getKey().startsWith("2")) {
          specStatuses.add(Integer.parseInt(response.getKey()));
        }
      }
    }
    assertThat(specStatuses).as("error statuses documented by operations").isEqualTo(codeStatuses);
  }

  @Test
  void no422Documented() throws IOException {
    JsonNode spec = readSpec(OPENAPI);
    List<String> offenders = new ArrayList<>();
    for (Operation op : operations(spec)) {
      if (op.node().path("responses").has("422")) {
        offenders.add(op.key());
      }
    }
    assertThat(offenders).as("operations documenting 422").isEmpty();
    assertThat(spec.at("/components/responses").has("422")).isFalse();
    assertThat(Arrays.stream(ErrorCode.values()).map(ErrorCode::status))
        .doesNotContain(HttpStatus.UNPROCESSABLE_ENTITY);
  }

  // ------------------------------------------------------------------ the checks must detect drift

  /** T026 Check: removing a path from a copy of the YAML must make the drift check fail, naming it. */
  @Test
  void detectsARouteMissingFromTheSpec() throws IOException {
    JsonNode spec = readSpec(OPENAPI);
    Set<String> inCode = new TreeSet<>(codeRoutes());
    inCode.add("GET /api/auth/me"); // pretend the route exists in code
    ((com.fasterxml.jackson.databind.node.ObjectNode) spec.get("paths")).remove("/api/auth/me");

    assertThat(routeDrift(spec, inCode)).anyMatch(p -> p.contains("GET /api/auth/me"));
  }

  @Test
  void detectsARouteMissingFromCode() throws IOException {
    Set<String> inCode = new TreeSet<>(codeRoutes());
    inCode.add("GET /api/not-in-the-spec");

    assertThat(routeDrift(readSpec(OPENAPI), inCode)).anyMatch(p -> p.contains("GET /api/not-in-the-spec"));
  }

  @Test
  void detectsABrokenRefAndA422() throws IOException {
    JsonNode spec = readSpec(OPENAPI);
    com.fasterxml.jackson.databind.node.ObjectNode login =
        (com.fasterxml.jackson.databind.node.ObjectNode) spec.at("/paths/~1api~1auth~1login/post/responses");
    login.putObject("422").put("$ref", "#/components/responses/DoesNotExist");

    assertThat(unresolvedRefs(spec)).contains("#/components/responses/DoesNotExist");
    assertThat(spec.at("/paths/~1api~1auth~1login/post/responses").has("422")).isTrue();
  }

  // ------------------------------------------------------------------ helpers

  static JsonNode readSpec(Path path) throws IOException {
    assertThat(path).as("contract file").exists();
    return YAML.readTree(Files.readString(path, StandardCharsets.UTF_8));
  }

  static List<Operation> operations(JsonNode spec) {
    List<Operation> result = new ArrayList<>();
    Iterator<Map.Entry<String, JsonNode>> paths = spec.get("paths").properties().iterator();
    while (paths.hasNext()) {
      Map.Entry<String, JsonNode> path = paths.next();
      for (String method : METHODS) {
        JsonNode node = path.getValue().get(method);
        if (node != null) {
          result.add(new Operation(method.toUpperCase(), normalise(path.getKey()), node.path("operationId").asText(""), node));
        }
      }
    }
    return result;
  }

  /** {@code {id}} and {@code {slug}} are the same route shape. */
  static String normalise(String path) {
    return path.replaceAll("\\{[^}]+}", "{}");
  }

  static Set<String> requirementIds(Path specMarkdown) throws IOException {
    Matcher matcher = Pattern.compile("\\*\\*(FR-\\d{3}[a-z]?)\\*\\*").matcher(Files.readString(specMarkdown, StandardCharsets.UTF_8));
    Set<String> ids = new HashSet<>();
    while (matcher.find()) {
      ids.add(matcher.group(1));
    }
    return ids;
  }

  static Set<String> unresolvedRefs(JsonNode root) {
    Set<String> missing = new TreeSet<>();
    collectRefs(root, root, missing);
    return missing;
  }

  private static void collectRefs(JsonNode root, JsonNode node, Set<String> missing) {
    if (node.isObject()) {
      JsonNode ref = node.get("$ref");
      if (ref != null && ref.isTextual()) {
        String target = ref.asText();
        if (!target.startsWith("#/") || root.at(target.substring(1)).isMissingNode()) {
          missing.add(target);
        }
      }
      node.forEach(child -> collectRefs(root, child, missing));
    } else if (node.isArray()) {
      node.forEach(child -> collectRefs(root, child, missing));
    }
  }

  /** Every {@code METHOD /api/...} mapped by a controller in the application's own packages. */
  static Set<String> codeRoutes() {
    Set<String> routes = new TreeSet<>();
    ClassPathScanningCandidateComponentProvider scanner = new ClassPathScanningCandidateComponentProvider(false);
    scanner.addIncludeFilter(new AnnotationTypeFilter(RestController.class));
    for (BeanDefinition definition : scanner.findCandidateComponents("com.bookhaven")) {
      Class<?> controller = ClassUtils.resolveClassName(definition.getBeanClassName(), null);
      RequestMapping classMapping = AnnotatedElementUtils.findMergedAnnotation(controller, RequestMapping.class);
      List<String> prefixes = classMapping == null || classMapping.path().length == 0 ? List.of("") : List.of(classMapping.path());
      for (Method method : controller.getDeclaredMethods()) {
        RequestMapping mapping = AnnotatedElementUtils.findMergedAnnotation(method, RequestMapping.class);
        if (mapping == null) {
          continue;
        }
        List<String> suffixes = mapping.path().length == 0 ? List.of("") : List.of(mapping.path());
        for (String prefix : prefixes) {
          for (String suffix : suffixes) {
            String path = normalise(prefix + suffix);
            if (!path.startsWith("/api/")) {
              continue;
            }
            for (RequestMethod requestMethod : mapping.method()) {
              routes.add(requestMethod.name() + " " + path);
            }
          }
        }
      }
    }
    return routes;
  }
}
