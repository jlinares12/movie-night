variable "service_location" {
    description = "Cloud Run's service location"
    type        = string
}

variable "cloud_run_name" {
  description = "Cloud Run's service name"
  type = string
}

variable "frontend_bucket_name" {
  description = "The bucket name of where our frontend lives"
  type = string
}

variable "domain" {
  description = "The domain of call time"
  type = string
}