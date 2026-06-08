# AZ Finds — daily 8:00 AM refresh.
# Logs the previous batch's top 5 to AZ_Finds_Daily_Top5.csv, regenerates 50
# products, attaches real photos, and rebuilds the dashboard.
# Registered as Scheduled Task "AZ Finds Daily 8AM".

$ErrorActionPreference = "Continue"
$proj = "C:\Users\User\Desktop\amazon-seller-mcp"
$log  = Join-Path $proj "scripts\daily-8am.log"
"==== $(Get-Date) : AZ Finds daily refresh starting ====" | Out-File -Append -Encoding utf8 $log

# Load PEXELS_API_KEY (and any other keys) from .env so images:enrich works.
$envFile = Join-Path $proj ".env"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([A-Z0-9_]+)\s*=\s*(.+)$') { Set-Item -Path ("Env:" + $Matches[1]) -Value $Matches[2].Trim() }
  }
}

Set-Location (Join-Path $proj "server")
"-- logging previous top 5 --" | Out-File -Append -Encoding utf8 $log
cmd /c "npm run research:top5log"  2>&1 | Out-File -Append -Encoding utf8 $log
"-- regenerating 50 products --"   | Out-File -Append -Encoding utf8 $log
cmd /c "npm run research:daily -- --force" 2>&1 | Out-File -Append -Encoding utf8 $log
"-- enriching images --"           | Out-File -Append -Encoding utf8 $log
cmd /c "npm run images:enrich"     2>&1 | Out-File -Append -Encoding utf8 $log

Set-Location (Join-Path $proj "artifact\app")
"-- rebuilding dashboard --"       | Out-File -Append -Encoding utf8 $log
cmd /c "npm run build"             2>&1 | Out-File -Append -Encoding utf8 $log

"==== $(Get-Date) : done ====" | Out-File -Append -Encoding utf8 $log
