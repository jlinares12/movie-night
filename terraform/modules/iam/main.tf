# Creates Service Accounts
resource "google_service_account" "github-actions-sa" {
  display_name = "${var.project_id}-${var.environment}-github-actions"
  account_id   = "${var.environment}-github-actions-sa"
  project      = var.project_id
}

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

# Policies for Github Actions
resource "google_project_iam_member" "github-actions-developer-policy" {
  project = var.project_id
  member  = "serviceAccount:${google_service_account.github-actions-sa.email}"
  role    = "roles/run.developer"
}

resource "google_project_iam_member" "github-actions-artifact-policy" {
  project = var.project_id
  member  = "serviceAccount:${google_service_account.github-actions-sa.email}"
  role    = "roles/artifactregistry.writer"
}

resource "google_project_iam_member" "github-actions-serviceAccount-policy" {
  project = var.project_id
  member  = "serviceAccount:${google_service_account.github-actions-sa.email}"
  role    = "roles/iam.serviceAccountTokenCreator"
}

# Github needs a storage binding for the frontend

resource "google_storage_bucket_iam_member" "github-actions-storage-policy" {
  member = "serviceAccount:${google_service_account.github-actions-sa.email}"
  role   = "roles/storage.objectAdmin"
  bucket = var.frontend_bucket_name
}

# WIF Resources
resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "${var.environment}-iam-pool"
  project                   = var.project_id
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_provider_id = "${var.environment}-pool-provider"
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  attribute_condition                = "assertion.repository == \"${var.github_repo}\""

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
  }
}

resource "google_service_account_iam_member" "wif-binding" {
  service_account_id = google_service_account.github-actions-sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/projects/${var.project_number}/locations/global/workloadIdentityPools/${google_iam_workload_identity_pool.github.workload_identity_pool_id}/attribute.repository/${var.github_repo}"
}
