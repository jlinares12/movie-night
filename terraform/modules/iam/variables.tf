variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "environment" {
  description = "Env or Prod environments"
  type        = string
}

variable "frontend_bucket_name" {
  description = "Name of the GCS bucket for the frontend"
  type        = string
}

variable "github_repo" {
  description = "My github org and repo name"
  type        = string
}

variable "project_number" {
  description = "Project number"
  type        = string
}
