<#
.SYNOPSIS
  Fails (exit 1) if the environment variables documented in README.md differ from those the backend reads.

.DESCRIPTION
  Documented side: backticked UPPER_SNAKE names in the first column of the table under the
  "Required environment variables" heading of README.md.
  Code side: every ${NAME} or ${NAME:default} placeholder in backend/src/main/resources/application*.properties
  and backend/src/main/java (AppProperties bindings and @Value lookups), plus System.getenv("NAME") calls.
  SPRING_PROFILES_ACTIVE is read by Spring Boot itself, not by this project's files, so it is exempt on both sides.
  Only names are compared; no value is ever read or printed.
#>
$ErrorActionPreference = 'Stop'

$root = (& git rev-parse --show-toplevel 2>$null)
if (-not $root) { Write-Error 'Not inside a git repository.'; exit 2 }
Set-Location $root

[string[]]$frameworkVars = @('SPRING_PROFILES_ACTIVE')

# Documented names
$readme = Join-Path $root 'README.md'
if (-not (Test-Path -LiteralPath $readme)) { Write-Host 'FAIL README.md not found'; exit 1 }

$documented = New-Object System.Collections.Generic.HashSet[string]
$inSection = $false
foreach ($line in [System.IO.File]::ReadLines($readme)) {
    if ($line -match '^##\s+Required environment variables') { $inSection = $true; continue }
    if ($inSection -and $line -match '^##\s+') { break }
    if ($inSection -and $line -match '^\|\s*`([A-Z][A-Z0-9_]+)`') { [void]$documented.Add($Matches[1]) }
}
$documented.ExceptWith([string[]]$frameworkVars)

# Names read by the backend
$sources = @()
$sources += Get-ChildItem -LiteralPath (Join-Path $root 'backend/src/main/resources') -Filter 'application*.properties' -File
$sources += Get-ChildItem -LiteralPath (Join-Path $root 'backend/src/main/java') -Recurse -Filter '*.java' -File

$read = New-Object System.Collections.Generic.HashSet[string]
foreach ($file in $sources) {
    $text = [System.IO.File]::ReadAllText($file.FullName)
    foreach ($m in [regex]::Matches($text, '\$\{([A-Z][A-Z0-9_]+)[:}]')) { [void]$read.Add($m.Groups[1].Value) }
    foreach ($m in [regex]::Matches($text, 'getenv\(\s*"([A-Z][A-Z0-9_]+)"')) { [void]$read.Add($m.Groups[1].Value) }
}
$read.ExceptWith([string[]]$frameworkVars)

$problems = New-Object System.Collections.Generic.List[string]
foreach ($name in ($read | Sort-Object)) {
    if (-not $documented.Contains($name)) { $problems.Add("read by the backend but missing from README.md: $name") }
}
foreach ($name in ($documented | Sort-Object)) {
    if (-not $read.Contains($name)) { $problems.Add("documented in README.md but not read by the backend: $name") }
}

if ($problems.Count -gt 0) {
    $problems | ForEach-Object { Write-Host "FAIL $_" }
    Write-Host "check-env-docs: $($problems.Count) difference(s) found."
    exit 1
}
Write-Host "check-env-docs: OK ($($documented.Count) variables documented and read)."
exit 0
