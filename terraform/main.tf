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

# API Registry
resource "google_project_service" "compute" {
  project            = var.project_id
  service            = "compute.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "artifact-registry" {
  project            = var.project_id
  service            = "artifactregistry.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "iam" {
  project            = var.project_id
  service            = "iam.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "secret-manager" {
  project            = var.project_id
  service            = "secretmanager.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "google-run" {
  project            = var.project_id
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "sql" {
  project            = var.project_id
  service            = "sqladmin.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "dns" {
  project            = var.project_id
  service            = "dns.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "domains" {
  project            = var.project_id
  service            = "domains.googleapis.com"
  disable_on_destroy = false
}

# Modules
module "storage" {
    source = "./modules/storage"

    project_id  = var.project_id
    environment = var.environment
    region      = var.region
    depends_on  = [ google_project_service.artifact-registry ]
}

module "sql" {
    source = "./modules/sql"

    project_id          = var.project_id
    region              = var.region
    deletion_protection = var.deletion_protection
    db_password         = var.db_password
    db_name             = var.db_name
    db_user             = var.db_user
    depends_on          = [ google_project_service.sql ]
}

module "iam" {
  source               = "./modules/iam"

  project_id           = var.project_id
  environment          = var.environment
  frontend_bucket_name = module.storage.frontend_bucket_name
  project_number       = var.project_number
  github_repo          = var.github_repo
  depends_on           = [ google_project_service.iam ]
}

module "secrets" {
  source       = "./modules/secrets"

  project_id   = var.project_id
  environment  = var.environment
  secret_names = [ "database-url", "secret-key", "clerk-secret-key", "clerk-webhook-secret", "clerk-jwks-url", "tmdb-api-key" ]
  depends_on   = [ google_project_service.secret-manager ]
}

module "run" {
  source                      = "./modules/run"

  environment                 = var.environment
  secret_ids                  = module.secrets.secret_ids
  service_account_email       = module.iam.sql-service-account-email
  db_instance_connection_name = module.sql.db_instance_connection_name
  region                      = var.region
  depends_on                  = [ google_project_service.google-run ]
}

data "terraform_remote_state" "shared" {
  backend = "gcs"
  config  = {
    bucket = "call-time-498809-shared-tfstate"
    prefix = "terraform/state"
  }
}

module "dns" {
  source      = "./modules/dns"

  domain      = var.domain
  lb_ip       = data.terraform_remote_state.shared.outputs.lb_ip
  create_zone = var.environment == "prod"
  depends_on  = [ google_project_service.dns ]
}
