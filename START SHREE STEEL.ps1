$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
try {
  $null = Get-Command node -ErrorAction Stop
} catch {
  Write-Host "Node.js is not installed. Install Node.js LTS from https://nodejs.org/" -ForegroundColor Red
  Read-Host "Press Enter to exit"
  exit 1
}
Start-Process "http://localhost:3000"
node .\server.js
Read-Host "Press Enter to close"
