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

variable "db_password" {
    description = "The Cloud SQL app user password"
    type        = string
    sensitive   = true
}