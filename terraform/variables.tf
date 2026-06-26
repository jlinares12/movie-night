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

# SQL MODULE VARIABLES

variable "db_name" {
    description = "Name of the PostgreSQL database"
    type        = string
}

variable "db_password" {
    description = "The Cloud SQL app user password"
    type        = string
    sensitive   = true
}

variable "db_user" {
    description = "Name of the PostgreSQL app user"
    type        = string
}

variable "deletion_protection" {
    description = "States if we want to enable deletion protection"
    type        = bool
}

# IAM Module Variables
variable "github_repo" {
  description = "My github org and repo name"
  type = string
}

variable "project_number" {
  description = "Project number"
  type = string
}

variable "domain" {
  description = "The domain of call time"
  type = string
}
