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

variable "environment" {
  type = string
}
