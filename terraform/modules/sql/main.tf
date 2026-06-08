variable "project_id" {
    description = "GCP project ID"
    type        = string
}

variable "region" {
    description = "Where to deploy resources"
    type        = string
    default     = "us-central1"
}

variable "db_name" {
    description = "Name of the PostgreSQL database"
    type        = string
}

variable "db_user" {
    description = "Name of the PostgreSQL app user"
    type        = string
}

variable "db_password" {
    description = "The Cloud SQL app user password"
    type        = string
    sensitive   = true
}

variable "deletion_protection" {
    description = "States if we want to enable deletion protection"
    type        = bool
}

resource "random_id" "call_time_db_id" {
  byte_length = 4
}

resource "google_sql_database_instance" "main_sql_instance" {
    name             = "main-instance-${random_id.call_time_db_id.hex}"
    database_version = "POSTGRES_16"
    region           = var.region
    project          = var.project_id
    deletion_protection = var.deletion_protection

    settings {
        tier                        = "db-f1-micro"
        deletion_protection_enabled = var.deletion_protection

        backup_configuration {
          enabled            = true
          start_time = "03:00"
        }
    }
}

resource "google_sql_database" "call_time_db" {
    name     = var.db_name
    instance = google_sql_database_instance.main_sql_instance.name
}

resource "google_sql_user" "users" {
    name     = var.db_user
    instance = google_sql_database_instance.main_sql_instance.name
    password = var.db_password
}