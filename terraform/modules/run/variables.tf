variable "region" {
  description = "Where to deploy resources"
  type        = string
  default     = "us-central1"
}

variable "service_account_email" {
  description = "Service account email from IAM module"
  type        = string
}

variable "db_instance_connection_name" {
  description = "DB connection name from SQL module"
  type        = string
}

variable "secret_ids" {
  description = "Map of all secret IDs"
  type        = map(string)
}