# Creates Service Accounts

resource "google_service_account" "cloud-run-sa" {
  display_name = "${var.project_id}-${var.environment}-cloud-run"
  account_id   = "${var.environment}-cloud-run-sa"
  project      = var.project_id
}

resource "google_service_account" "cloudbuild-sa" {
  display_name = "${var.project_id}-${var.environment}-cloudbuild"
  account_id   = "${var.environment}-cloudbuild-sa"
  project      = var.project_id
}

# IAM Member Project Policies

# Policies for Cloud Run
resource "google_project_iam_member" "cloud-run-sql-policy" {
  project = var.project_id
  member  = "serviceAccount:${google_service_account.cloud-run-sa.email}"
  role    = "roles/cloudsql.client"
}

resource "google_project_iam_member" "cloud-run-secrets-policy" {
  project = var.project_id
  member  = "serviceAccount:${google_service_account.cloud-run-sa.email}"
  role    = "roles/secretmanager.secretAccessor"
}

resource "google_project_iam_member" "cloud-run-artifact-policy" {
  project = var.project_id
  member  = "serviceAccount:${google_service_account.cloud-run-sa.email}"
  role    = "roles/artifactregistry.reader"
}

# Cloudbuild IAM Policies

## Deploy new revisions
resource "google_project_iam_member" "cloudbuild-run-policy" {
  project = var.project_id
  member  = "serviceAccount:${google_service_account.cloudbuild-sa.email}"
  role    = "roles/run.admin"
}

## Act as the Cloud Run runtime SA when deploying
resource "google_service_account_iam_member" "cloudbuild-actas-runtime" {
  service_account_id = google_service_account.cloud-run-sa.id
  role = "roles/iam.serviceAccountUser"
  member = "serviceAccount:${google_service_account.cloudbuild-sa.email}"
}

resource "google_artifact_registry_repository_iam_member" "cloudbuild-artifact-policy" {
  project    = var.project_id
  location   = var.region
  repository = var.artifact_registry_repository_id
  member     = "serviceAccount:${google_service_account.cloudbuild-sa.email}"
  role       = "roles/artifactregistry.writer"
}

## Cloud Build needs to sync to frontend bucket
resource "google_storage_bucket_iam_member" "cloudbuild-storage-policy" {
  member = "serviceAccount:${google_service_account.cloudbuild-sa.email}"
  role   = "roles/storage.objectAdmin"
  bucket = var.frontend_bucket_name
}

resource "google_project_iam_member" "cloudbuild-logs-policy" {
  project = var.project_id
  member  = "serviceAccount:${google_service_account.cloudbuild-sa.email}"
  role    = "roles/logging.logWriter"
}

# Storage Policies
resource "google_storage_bucket_iam_member" "frontend_public_read" {
  bucket = var.frontend_bucket_name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}
