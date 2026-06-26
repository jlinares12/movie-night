variable "project_id" {
    description = "GCP project ID"
    type        = string
}

variable "secret_names" {
  type        = list(string)
  description = "The short names of the secrets to create"
}