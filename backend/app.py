import logging
import threading
import time
import os

# google-cloud-storage is only needed in SQL/GCS mode; skip gracefully if absent
try:
    from google.cloud import storage
except ImportError:
    storage = None

from flask import Flask
from flask_cors import CORS

app = Flask(__name__, static_folder='static', template_folder='templates')

STORAGE_BACKEND = os.environ.get('STORAGE_BACKEND', 'sql')

# Configure CORS: allow localhost during development and your production frontend
ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,https://dartball-backend-654879525708.us-central1.run.app,https://jth16.github.io,https://ltvfdartball.com"
)
_origins = [o.strip() for o in ALLOWED_ORIGINS.split(",") if o.strip()]

# register CORS globally (allow X-Download-Token header used by frontend)
CORS(app, resources={r"/*": {
    "origins": _origins,
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    "allow_headers": ["Content-Type", "X-Download-Token", "Authorization", "X-Requested-With"]
}}, supports_credentials=True)

app.logger.info("CORS configured for origins: %s", _origins)

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

if STORAGE_BACKEND != 'json':
    # Prefer explicit URI for local dev
    env_uri = os.environ.get("SQLALCHEMY_DATABASE_URI")
    if env_uri:
        app.config["SQLALCHEMY_DATABASE_URI"] = env_uri
    else:
        CLOUD_SQL_CONNECTION_NAME = os.environ.get("CLOUD_SQL_CONNECTION_NAME") or os.environ.get("CLOUDSQL_INSTANCE")
        DB_USER = os.environ.get("DB_USER")
        DB_PASS = os.environ.get("DB_PASS")
        DB_NAME = os.environ.get("DB_NAME")

        if not (CLOUD_SQL_CONNECTION_NAME and DB_USER and DB_PASS and DB_NAME):
            app.logger.error("Cloud SQL configuration is missing. Set CLOUD_SQL_CONNECTION_NAME, DB_USER, DB_PASS, DB_NAME or set SQLALCHEMY_DATABASE_URI")
            raise RuntimeError("Cloud SQL configuration missing")

        app.config["SQLALCHEMY_DATABASE_URI"] = (
            f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@/{DB_NAME}"
            f"?host=/cloudsql/{CLOUD_SQL_CONNECTION_NAME}"
        )

    app.logger.info("Using SQL backend: %s", app.config.get("SQLALCHEMY_DATABASE_URI", "")[:60])

    # initialize SQLAlchemy from models.py
    from models import db
    db.init_app(app)

    # Ensure DB tables exist at startup (works under gunicorn)
    with app.app_context():
        try:
            db.create_all()
            app.logger.info("DB tables ensured/created")
        except Exception:
            app.logger.exception("Failed to create DB tables")
else:
    app.logger.info("STORAGE_BACKEND=json — skipping database initialization")

# register blueprint routes
from routes import routes as routes_bp
app.register_blueprint(routes_bp)

logging.basicConfig(level=logging.INFO)

if __name__ == "__main__":
    FLASK_ENV = os.environ.get("FLASK_ENV", "production")
    if STORAGE_BACKEND != 'json':
        with app.app_context():
            from models import db
            db.create_all()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)), debug=(FLASK_ENV != "production"))
