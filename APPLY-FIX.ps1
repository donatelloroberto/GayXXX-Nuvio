$ErrorActionPreference = 'Stop'
$Repo = Split-Path -Parent $MyInvocation.MyCommand.Path
$Repo = Join-Path $Repo 'repo'
Set-Location $Repo
if (Test-Path 'package-lock.json') { Remove-Item 'package-lock.json' -Force }
Write-Host 'package-lock.json removed.'
Write-Host 'Commit all files in the repo folder, then redeploy in Vercel with build cache cleared.'
