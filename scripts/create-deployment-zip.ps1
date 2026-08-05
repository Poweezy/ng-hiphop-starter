# Create a clean deployment zip for the NG Hip-Hop Platform.
# Packages SOURCE code for Vercel / Railway / DigitalOcean / cPanel Node.js.
# Deliberately EXCLUDES secrets, build artifacts, local DB, node_modules,
# and user-uploaded media.

$ErrorActionPreference = 'Stop'

$zipName = 'ng-hiphop-deployment.zip'
$tempDir = 'deploy_pkg'

function Write-Step([string]$msg) {
    Write-Host "==> $msg"
}

Write-Step "Cleaning previous artifacts..."
if (Test-Path $zipName) { Remove-Item $zipName -Force }
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }

New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Directories to copy (source code)
$dirsToCopy = @(
    'app',
    'components',
    'hooks',
    'lib',
    'data',
    'types',
    'prisma',
    'public\images'
)

# Root files to copy
$filesToCopy = @(
    'package.json',
    'package-lock.json',
    'next.config.js',
    'tsconfig.json',
    'next-env.d.ts',
    'middleware.ts',
    'sentry.client.config.ts',
    'sentry.edge.config.ts',
    'sentry.server.config.ts',
    '.gitignore',
    '.env.example',
    'README.md',
    'DEPLOYMENT.md',
    'QUICKSTART.md',
    'CONTRIBUTING.md'
)

Write-Step "Copying source directories..."
foreach ($d in $dirsToCopy) {
    if (Test-Path $d) {
        robocopy $d (Join-Path $tempDir $d) /E /XD node_modules .next /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
    }
}

Write-Step "Copying root files..."
foreach ($f in $filesToCopy) {
    if (Test-Path $f) {
        Copy-Item $f (Join-Path $tempDir $f) -Force
    }
}

# Ensure an empty uploads dir exists so the runtime can create it
New-Item -ItemType Directory -Path "$tempDir\public\uploads" -Force | Out-Null

Write-Step "Creating zip archive: $zipName"
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipName -Force

Write-Step "Cleaning staging directory..."
Remove-Item -Recurse -Force $tempDir

$fileInfo = Get-Item $zipName
$sizeInMb = [Math]::Round($fileInfo.Length / 1MB, 2)

Write-Host ""
Write-Host "==============================================="
Write-Host "SUCCESS! Package ready: $zipName"
Write-Host "Size: $sizeInMb MB"
Write-Host "==============================================="
