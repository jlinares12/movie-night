variable "region" {
  description = "Where to deploy resources"
  type        = string
  default     = "us-central1"
}

variable "service-account-email" {
  description = "Service account email from IAM module"
  type = string
}

variable "db-instance-connection-name" {
  description = "DB connection name from SQL module"
  type = string
}

variable "secret_ids" {
  description = "Map of all secret IDs"
  type = map(string)
}