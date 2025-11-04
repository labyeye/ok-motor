# elevate-and-build.ps1
# Location: frontend/scripts/elevate-and-build.ps1
# Purpose: Relaunch this script as administrator if not elevated, then run the Windows electron build.

param()

function Is-RunAsAdministrator {
    $currentIdentity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentIdentity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Is-RunAsAdministrator)) {
    Write-Host "Not running as Administrator. Restarting elevated..."
    # Relaunch the same script elevated
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "powershell"
    $escaped = $MyInvocation.MyCommand.Definition -replace '"','\"'
    $psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$escaped`""
    $psi.Verb = "runas"
    try {
        [System.Diagnostics.Process]::Start($psi) | Out-Null
    } catch {
        Write-Error "Elevation was canceled or failed: $_"
    }
    exit
}

Write-Host "Running elevated build..."

# Determine project root (assumes script is in ./scripts/) and change there
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$projectRoot = Resolve-Path (Join-Path $scriptDir "..")
Set-Location $projectRoot

# Run the regular win build (this will run npm scripts and electron-builder)
Write-Host "In project root: $((Get-Location).Path)"

# Use Start-Process so output appears in a new window and stays elevated.
# We call npm directly; this will open a new elevated PowerShell window and run the build.
$npmCmd = "npm"
$npmArgs = "run electron:build:win"

$startInfo = New-Object System.Diagnostics.ProcessStartInfo
$startInfo.FileName = $npmCmd
$startInfo.Arguments = $npmArgs
$startInfo.UseShellExecute = $false
$startInfo.RedirectStandardOutput = $true
$startInfo.RedirectStandardError = $true
$proc = [System.Diagnostics.Process]::Start($startInfo)

# Stream output to console
while (-not $proc.HasExited) {
    while (-not $proc.StandardOutput.EndOfStream) { $line = $proc.StandardOutput.ReadLine(); Write-Host $line }
    while (-not $proc.StandardError.EndOfStream) { $line = $proc.StandardError.ReadLine(); Write-Host $line }
    Start-Sleep -Milliseconds 200
}

# Read remaining
while (-not $proc.StandardOutput.EndOfStream) { $line = $proc.StandardOutput.ReadLine(); Write-Host $line }
while (-not $proc.StandardError.EndOfStream) { $line = $proc.StandardError.ReadLine(); Write-Host $line }

if ($proc.ExitCode -ne 0) { Write-Error "Build failed with exit code $($proc.ExitCode)" } else { Write-Host "Build finished successfully." }
