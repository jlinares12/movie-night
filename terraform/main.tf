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

module "storage" {
    source = "./modules/storage"

    project_id  = var.project_id
    environment = var.environment
    region      = var.region
}

module "sql" {
    source = "./modules/sql"

    project_id          = var.project_id
    region              = var.region
    deletion_protection = var.deletion_protection
    db_password         = var.db_password
    db_name             = var.db_name
    db_user             = var.db_user
}

module "iam" {
  source = "./modules/iam"

  project_id = var.project_id
  environment = var.environment
  frontend_bucket_name = module.storage.frontend_bucket_name
  project_number = var.project_number
  github_repo = var.github_repo
}

module "networking" {
  source = "./modules/networking"

  project_id  = var.project_id
  environment = var.environment
}
