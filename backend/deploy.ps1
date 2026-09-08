param(
    [string]$Project = "firstamerciantestaddress",
    [string]$Image = ""
)

if (-not $Image -or $Image -eq "") {
    $Image = "gcr.io/$Project/dartball-backend:latest"
}

# Read SQLALCHEMY_DATABASE_URI (Neon) from backend/.env — never hardcode it here.
$envFile = Join-Path $PSScriptRoot ".env"
$SqlAlchemyUri = ""
if (Test-Path $envFile) {
    $line = Get-Content $envFile | Where-Object { $_ -match '^SQLALCHEMY_DATABASE_URI=' }
    if ($line) { $SqlAlchemyUri = ($line -split '=', 2)[1] }
}
if (-not $SqlAlchemyUri -or $SqlAlchemyUri -eq "") {
    Write-Error "SQLALCHEMY_DATABASE_URI not found in backend/.env — copy .env.example to .env and fill it in."
    exit 1
}

# Strip extra query params like &channel_binding=require — gcloud's Windows .cmd wrapper
# runs through cmd.exe, which treats a bare & as a command separator and truncates the value.
# sslmode=require alone is sufficient for the psycopg2 connection.
$SqlAlchemyUri = ($SqlAlchemyUri -split '&')[0]

Write-Host "Project: $Project"
Write-Host "Image: $Image"

Write-Host "Starting Cloud Build to build and push image..."
gcloud builds submit --tag $Image --project $Project .
if ($LASTEXITCODE -ne 0) {
    Write-Error "Cloud Build failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "Deploying image to Cloud Run..."
# Uses --update-env-vars (incremental) so ALLOWED_ORIGINS and FIREBASE_SERVICE_ACCOUNT_JSON,
# which are managed separately, are left untouched.
$gcloudArgs = @(
    "run", "deploy", "dartball-backend",
    "--image", $Image,
    "--region", "us-central1", "--platform", "managed", "--allow-unauthenticated",
    "--update-env-vars", "SQLALCHEMY_DATABASE_URI=$SqlAlchemyUri",
    "--project", $Project
)
& gcloud @gcloudArgs

if ($LASTEXITCODE -ne 0) {
    Write-Error "gcloud run deploy failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "Deploy successful."
