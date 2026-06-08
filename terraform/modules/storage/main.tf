variable "project_id" {
    description = "GCP project ID"
    type        = string
}

variable "region" {
    description = "Where to deploy resources"
    type        = string
    default     = "us-central1"
}

variable "environment" {
    description = "Name resources and toggle behaviors (dev or prod)"
    type        = string
}

resource "google_storage_bucket" "gcs_state_bucket" {
    name     = "${var.project_id}-${var.environment}-tfstate"
    location = var.region
    versioning {
      enabled = true
    }
}

resource "google_storage_bucket" "frontend_storage_bucket" {
    name     = "${var.project_id}-${var.environment}-frontend-bucket"
    location = var.region
    website {
      main_page_suffix = "index.html"
      not_found_page   = "index.html"
    }
}

resource "google_artifact_registry_repository" "docker-repo" {
    location      = var.region
    repository_id = "${var.project_id}-${var.environment}-artifact-registry"
    description   = "example docker repository"
    format        = "DOCKER"
}