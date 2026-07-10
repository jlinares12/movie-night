variable "project_id" {
  type = string
}

variable "region" {
  type    = string
  default = "us-central1"
}

variable "github_app_installation_id" {
  type = string
}

variable "github_oauth_token_secret_version" {
  type = string
}

variable "github_repo_url" {
  type = string
}

variable "dev_domain" {
  type    = string
  default = "devel.calltime.dev"
}

variable "prod_domain" {
  type    = string
  default = "calltime.dev"
}