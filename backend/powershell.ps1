gcloud run deploy dartball-backend --image gcr.io/firstamerciantestaddress/dartball-backend:latest --region us-central1 --platform managed --allow-unauthenticated --set-env-vars "USE_SQLITE=true,GCS_BUCKET=dartball2025,GCS_DB_PATH=instance/league.db,LOCAL_DB_PATH=/tmp/league.db,DOWNLOAD_TOKEN=your-token" --project=firstamerciantestaddress


gcloud run services describe dartball-backend --region=us-central1 --project=firstamerciantestaddress --format="yaml(spec.template.spec.containers[0].env)"

gcloud run services describe dartball-backend --region=us-central1 --project=firstamerciantestaddress  --format="value(spec.template.spec.containers[0].volumeMounts, spec.template.spec.volumes)"

gcloud run services logs read dartball-backend --region=us-central1 --project=firstamerciantestaddress --limit 200  grep -E "Using Cloud SQL|Using local SQLite|SQLALCHEMY_DATABASE_URI|password authentication failed"