variable "region" {
  description = "Where to deploy resources"
  type        = string
  default     = "us-central1"
}

variable "github_app_installation_id" {
  description = "The installation id for github"
  type        = string
}

variable "github_oauth_token_secret_version" {
  description = "github token"
  type        = string
}

variable "github_repo_url" {
  description = "Repository url for Call Time repository"
  type        = string
}

variable "cloud_run_sa_id" {
  description = "Service account id for cloud run from iam module"
  type = string
}