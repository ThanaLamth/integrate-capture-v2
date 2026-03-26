param(
  [Parameter(Mandatory = $true)]
  [string]$PlatformKey,

  [Parameter(Mandatory = $true)]
  [string]$Url,

  [Parameter(Mandatory = $true)]
  [string]$CaptureKey,

  [Parameter(Mandatory = $true)]
  [string]$OutputPath,

  [switch]$Headed
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Push-Location $repoRoot
try {
  npm run build | Out-Host

  $args = @(
    "dist/src/cli/main.js",
    "--platform", $PlatformKey,
    "--url", $Url,
    "--capture", $CaptureKey,
    "--output", $OutputPath
  )

  if ($Headed) {
    $args += "--headed"
  }

  node @args
}
finally {
  Pop-Location
}
