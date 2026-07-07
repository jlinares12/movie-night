terraform {
  required_version = "~> 1.9"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  #backend "gcs" {}
}

provider "google" {
  project = var.project_id
  region  = var.region
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
