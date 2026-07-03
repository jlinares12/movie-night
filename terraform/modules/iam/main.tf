# Creates Service Accounts

resource "google_service_account" "cloud-run-sa" {
  display_name = "${var.project_id}-${var.environment}-cloud-run"
  account_id   = "${var.environment}-cloud-run-sa"
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


