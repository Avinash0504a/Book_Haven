<#
.SYNOPSIS
  Fails (exit 1) if a committed or committable file contains a secret.

.DESCRIPTION
  Scans every file that git tracks, plus files that are untracked but not ignored
  (so a stray secret is caught before it is added). Checks:
    1. A file named .env or .env.* exists.
    2. A password, secret, or jwt assignment with a literal value.
    3. A JDBC URL with an embedded password.
  Values that are references (${VAR}, $env:VAR, System.getenv, environment lookups) are allowed.
  A line may carry the marker "check-secrets:allow" to opt out (use for test fixtures only).

  Not scanned: spec and planning documents (specs, docs, .specify, .bob, reference) and this script,
  because they describe secrets in prose. Test sources are checked for files and JDBC URLs only.
#>
$ErrorActionPreference = 'Stop'

$root = (& git rev-parse --show-toplevel 2>$null)
if (-not $root) { Write-Error 'Not inside a git repository.'; exit 2 }
Set-Location $root

$skipDirs = @('specs/', 'docs/', '.specify/', '.bob/', 'reference/', 'node_modules/', 'target/', 'dist/')
$skipFiles = @('scripts/check-secrets.ps1')
$configExt = @('.properties', '.yml', '.yaml', '.json', '.xml', '.env', '.ps1', '.sh', '.toml', '.ini', '.conf', '.sql')
$codeExt = @('.java', '.js', '.jsx', '.mjs', '.ts', '.tsx')

# Config files: key containing password/secret/jwt, then = or :, then a literal that is not a reference.
# Exempt only a numeric lifetime setting such as app.jwt.expiration-ms=${APP_JWT_EXPIRATION_MS:3600000}.
$lifetimePattern = '(?i)^\s*[\w.\-]*(expiration|ttl|lifetime)[\w.\-]*\s*=\s*\$\{[A-Z_]+:\d+\}\s*$'
$configPattern = '(?i)\b[\w.\-]*(password|passwd|secret|jwt)[\w.\-]*\s*[=:]\s*(?!\s*$)(?!\$\{)(?!\$env:)(?!\s*#)["'']?[^\s"''$#{]+'
# Code files: the same keys assigned a quoted string literal.
$codePattern = '(?i)\b\w*(password|passwd|secret|jwt)\w*\s*[=:]\s*["''][^"'']+["'']'
$jdbcPattern = '(?i)jdbc:\S*(password=|://[^/\s:@]+:[^/\s@]+@)'

$files = @(& git ls-files --cached --others --exclude-standard) | Where-Object { $_ }
$problems = New-Object System.Collections.Generic.List[string]

foreach ($f in $files) {
    $norm = $f -replace '\\', '/'
    $leaf = Split-Path $norm -Leaf

    if ($skipFiles -contains $norm) { continue }
    if ($skipDirs | Where-Object { $norm.StartsWith($_) }) { continue }

    if ($leaf -match '^\.env(\..+)?$') {
        $problems.Add("${norm}: environment file must not be committed")
        continue
    }
    if (-not (Test-Path -LiteralPath $f -PathType Leaf)) { continue }

    $ext = [System.IO.Path]::GetExtension($leaf).ToLowerInvariant()
    $isTest = ($norm -match '(^|/)src/test/') -or ($leaf -match '\.test\.[jt]sx?$')
    $isConfig = $configExt -contains $ext
    $isCode = ($codeExt -contains $ext) -and (-not $isTest)
    $scanJdbc = $isConfig -or ($codeExt -contains $ext)
    if (-not ($isConfig -or $isCode -or $scanJdbc)) { continue }

    $lineNo = 0
    foreach ($line in [System.IO.File]::ReadLines((Resolve-Path -LiteralPath $f))) {
        $lineNo++
        if ($line -match 'check-secrets:allow') { continue }
        if ($line -match $lifetimePattern) { continue }
        if ($isConfig -and $line -match $configPattern) {
            $problems.Add("${norm}:${lineNo}: literal value assigned to a password, secret or jwt setting")
        }
        elseif ($isCode -and $line -match $codePattern) {
            $problems.Add("${norm}:${lineNo}: string literal assigned to a password, secret or jwt name")
        }
        if ($scanJdbc -and $line -match $jdbcPattern) {
            $problems.Add("${norm}:${lineNo}: JDBC URL with an embedded password")
        }
    }
}

if ($problems.Count -gt 0) {
    # Report location and rule only. Never print the matched value.
    $problems | ForEach-Object { Write-Host "FAIL $_" }
    Write-Host "check-secrets: $($problems.Count) problem(s) found."
    exit 1
}
Write-Host "check-secrets: OK ($($files.Count) files considered)."
exit 0
