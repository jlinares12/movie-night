terraform {
    required_providers {
      google = {
        source = "hashicorp/google"
        version = "~> 5.0"
      }
    }
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