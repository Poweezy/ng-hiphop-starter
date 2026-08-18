# Verify a deployment zip created by create-deployment-zip.ps1.
# Checks: file exists, zip integrity, no secrets leaked, expected entries present.
#
# Usage:  .\scripts\verify-zip.ps1 [-ZipPath 'ng-hiphop-deployment.zip']

param(
    [string]$ZipPath = 'ng-hiphop-deployment.zip'
)

$ErrorActionPreference = 'Stop'

function Write-Step([string]$msg) {
    Write-Host "==> $msg"
}

function Write-Pass([string]$msg) {
    Write-Host "  [PASS] $msg"
}

function Write-Fail([string]$msg) {
    Write-Host "  [FAIL] $msg" -ForegroundColor Red
}

# ─── 1. Existence ────────────────────────────────────────────────────────────

Write-Step "Checking zip existence..."
if (-not (Test-Path $ZipPath)) {
    Write-Fail "$ZipPath not found"
    exit 1
}
Write-Pass "Zip file exists"

# ─── 2. Zip integrity ────────────────────────────────────────────────────────

Write-Step "Verifying zip integrity..."
try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path $ZipPath).Path)
    $entries = $zip.Entries
    $zip.Dispose()
    Write-Pass "Zip is valid ($($entries.Count) entries)"
} catch {
    Write-Fail "Zip is corrupt or unreadable: $_"
    exit 1
}

# ─── 3. Expected entries ─────────────────────────────────────────────────────

Write-Step "Checking for expected entries..."
$entryNames = $entries.Name | Sort-Object -Unique

$requiredEntries = @('package.json', 'next.config.js', 'tsconfig.json', 'middleware.ts', '.env.example')
$missing = @()
foreach ($e in $requiredEntries) {
    if (-not ($entryNames -contains $e)) {
        $missing += $e
    }
}

if ($missing.Count -gt 0) {
    Write-Fail "Missing required entries: $($missing -join ', ')"
    exit 1
}
Write-Pass "All required root files present"

$requiredDirs = @('app', 'components', 'lib')
foreach ($d in $requiredDirs) {
    $found = $entries.FullName | Where-Object { $_ -like "$d\*" }
    if (-not $found) {
        Write-Fail "Missing directory: $d"
        exit 1
    }
    Write-Pass "Directory '$d' present"
}

# ─── 4. Secret leakage check ─────────────────────────────────────────────────

Write-Step "Scanning for secret leakage..."
$secretPatterns = @(
    'AWS_SECRET_ACCESS_KEY',
    'AWS_ACCESS_KEY_ID',
    'NEXTAUTH_SECRET',
    'DATABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'UPSTASH_REDIS_REST_TOKEN',
    'SENTRY_AUTH_TOKEN'
)

$leakedSecrets = @()
foreach ($entry in $entries) {
    if ($entry.Length -eq 0 -or -not $entry.Name.EndsWith('.ts') -and -not $entry.Name.EndsWith('.js') -and -not $entry.Name.EndsWith('.json') -and -not $entry.Name.EndsWith('.env.example')) {
        continue
    }
    if ($entry.Name -eq '.env.example') { continue }

    try {
        $stream = $entry.Open()
        $reader = New-Object System.IO.StreamReader($stream)
        $content = $reader.ReadToEnd()
        $reader.Close()
        $stream.Close()

        foreach ($pattern in $secretPatterns) {
            if ($content -match "(?<!env\.example\s)(?<!\w)$pattern\s*=\s*['\"]\S") {
                $leakedSecrets += "$($entry.FullName):$pattern"
            }
        }
    } catch {
        # Skip binary or unreadable entries
    }
}

if ($leakedSecrets.Count -gt 0) {
    Write-Fail "Potential secrets found in zip:"
    $leakedSecrets | ForEach-Object { Write-Fail "  $_" }
    exit 1
}
Write-Pass "No secrets detected"

# ─── 5. .env should NOT be in the zip ─────────────────────────────────────────

Write-Step "Checking that .env is excluded..."
$envEntries = $entries.FullName | Where-Object { $_ -eq '.env' -or $_ -like '.env*' }
if ($envEntries) {
    Write-Fail ".env file found in zip: $envEntries"
    exit 1
}
Write-Pass ".env is not included"

# ─── Done ────────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "==============================================="
Write-Host "VERIFICATION PASSED"
Write-Host "Zip is valid and safe to deploy."
Write-Host "==============================================="
exit 0
