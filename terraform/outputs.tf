output "artifact_registry" {
    description = "Artifact Registry repository URL"
    value = module.storage.artifact_registry
}

output "frontend_bucket_name" {
    description = "The bucket name of where our frontend lives"
    value = module.storage.frontend_bucket_name
}

output "db_instance_connection_name" {
    description = "The connection name of the Cloud SQL instance"
    value = module.sql.db_instance_connection_name
}

output "lb_ip" {
  value = module.lb.lb_ip
}

output "cloud_run_url" {
  value = module.run.cloud_run_url
}
