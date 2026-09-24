$ErrorActionPreference = 'Stop'

if (-not $env:POSTGRES_URL_NON_POOLING -and (Test-Path -LiteralPath '.env.local')) {
  Get-Content -LiteralPath '.env.local' | Where-Object { $_ -match '^[A-Z0-9_]+=' } | ForEach-Object {
    $parts = $_ -split '=', 2
    if ($parts[0] -eq 'POSTGRES_URL_NON_POOLING') {
      $env:POSTGRES_URL_NON_POOLING = $parts[1].Trim('"')
    }
  }
}

if (-not $env:POSTGRES_URL_NON_POOLING) {
  throw 'POSTGRES_URL_NON_POOLING is not available in the environment or .env.local.'
}

npx supabase db push --db-url $env:POSTGRES_URL_NON_POOLING --include-all
npx supabase migration list --db-url $env:POSTGRES_URL_NON_POOLING
