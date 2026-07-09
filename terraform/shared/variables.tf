variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "github_app_installation_id" {
  description = "GitHub App installation ID from Cloud Build connection"
  type        = string
  sensitive   = true
}

variable "github_oauth_token_secret_version" {
  description = "Secret Manager resource name for GitHub OAuth token"
  type        = string
  sensitive   = true
}

variable "github_repo_url" {
  description = "GitHub repository URL"
  type        = string
}

variable "dev_cloud_run_name" {
  description = "Dev Cloud Run service name"
  type        = string
  default     = "movie-night-api-dev"
}

variable "prod_cloud_run_name" {
  description = "Prod Cloud Run service name"
  type        = string
  default     = "movie-night-api-prod"
}

variable "dev_frontend_bucket_name" {
  description = "Dev frontend GCS bucket name"
  type        = string
}

variable "prod_frontend_bucket_name" {
  description = "Prod frontend GCS bucket name"
  type        = string
}

variable "dev_domain" {
  description = "Dev environment domain"
  type        = string
}

variable "prod_domain" {
  description = "Prod environment domain"
  type        = string
}