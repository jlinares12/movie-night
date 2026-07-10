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

variable "project_number" {
  description = "Project number"
  type        = string
}

variable "region" {
  description = "GCP region for regional resources (e.g. Artifact Registry IAM bindings)"
  type        = string
}

variable "artifact_registry_repository_id" {
  description = "Artifact Registry repository ID to grant Cloud Build write access to"
  type        = string
}

variable "clerk_publishable_key_secret_id" {
  type        = string
  description = "Secret Manager secret ID for the Clerk publishable key, used to grant Cloud Build read access at frontend build time"
}
