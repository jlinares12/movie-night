terraform {
  required_version = "~> 1.9"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  backend "gcs" {}
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Data source to check/enable API
data "google_project_service" "cloud-build" {
  project = var.project_id
  service = "cloudbuild.googleapis.com"
}

module "lb" {
  source = "../modules/lb"

  service_location          = var.region
  dev_cloud_run_name        = var.dev_cloud_run_name
  prod_cloud_run_name       = var.prod_cloud_run_name
  dev_frontend_bucket_name  = var.dev_frontend_bucket_name
  prod_frontend_bucket_name = var.prod_frontend_bucket_name
  dev_domain                = var.dev_domain
  prod_domain               = var.prod_domain
}

module "cloudbuild" {
  source = "../modules/cloudbuild"

  project_id                        = var.project_id
  region                            = var.region
  github_app_installation_id        = var.github_app_installation_id
  github_oauth_token_secret_version = var.github_oauth_token_secret_version
  github_repo_url                   = var.github_repo_url
}
