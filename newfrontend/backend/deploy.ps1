param(
    [string]$Project = "firstamerciantestaddress",
    [string]$Image = "",
    [string]$DownloadToken = "your-token",
    [string]$CloudSqlInstance = "firstamerciantestaddress:us-central1:dartballpost",
    [string]$DbUser = "appuser",
    [string]$DbPass = "NewPass123!",
    [string]$DbName = "postgres"
)

if (-not $Image -or $Image -eq "") {
    $Image = "gcr.io/$Project/dartball-backend:latest"
}

Write-Host "Project: $Project"
Write-Host "Image: $Image"
Write-Host "Cloud SQL instance: $CloudSqlInstance"
Write-Host "DB name: $DbName DB user: $DbUser"

Write-Host "Starting Cloud Build to build and push image..."
gcloud builds submit --tag $Image --project $Project .
if ($LASTEXITCODE -ne 0) {
    Write-Error "Cloud Build failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}


if ($CloudSqlInstance -ne "" -and $DbUser -ne "" -and $DbPass -ne "" -and $DbName -ne "") {
    $envVars += "CLOUD_SQL_CONNECTION_NAME=$CloudSqlInstance"
    $envVars += "DB_USER=$DbUser"
    $envVars += "DB_PASS=$DbPass"
    $envVars += "DB_NAME=$DbName"
    # optionally disable sqlite fallback if you want:
    $envVars += "USE_SQLITE=false"
}

$envStr = ($envVars -join ",")

Write-Host "Deploying image to Cloud Run..."
$deployCmd = "gcloud run deploy dartball-backend --image $Image --region us-central1 --platform managed --allow-unauthenticated --set-env-vars `"$envStr`" --project $Project"
if ($CloudSqlInstance -ne "") {
    # add Cloud SQL instances attachment so unix socket is available in container
    $deployCmd += " --add-cloudsql-instances $CloudSqlInstance"
}
$gcloudArgs = @(
  "run","deploy","dartball-backend",
  "--image","gcr.io/firstamerciantestaddress/dartball-backend:latest",
  "--region","us-central1","--platform","managed","--allow-unauthenticated",
  "--set-env-vars","CLOUD_SQL_CONNECTION_NAME=firstamerciantestaddress:us-central1:dartballpost,DB_USER=appuser,DB_PASS=NewPass123!,DB_NAME=postgres,USE_SQLITE=false",
  "--add-cloudsql-instances","firstamerciantestaddress:us-central1:dartballpost",
  "--project","firstamerciantestaddress"
)
& gcloud @gcloudArgs

if ($LASTEXITCODE -ne 0) {
    Write-Error "gcloud run deploy failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "Deploy successful."