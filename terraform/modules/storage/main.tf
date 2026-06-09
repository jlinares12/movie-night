resource "google_storage_bucket" "gcs_state_bucket" {
    name     = "${var.project_id}-${var.environment}-tfstate"
    project  = var.project_id
    location = var.region
    versioning {
        enabled = true
    }
}

resource "google_storage_bucket" "frontend_storage_bucket" {
    name     = "${var.project_id}-${var.environment}-frontend-bucket"
    location = var.region
    project  = var.project_id
    website {
      main_page_suffix = "index.html"
      not_found_page   = "index.html"
    }
}

resource "google_artifact_registry_repository" "docker-repo" {
    location      = var.region
    project  = var.project_id
    repository_id = "${var.project_id}-${var.environment}-artifact-registry"
    description   = "Docker images for the ${var.environment} environment"
    format        = "DOCKER"
}