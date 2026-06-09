output "artifact_registry" {
    description = "Artifact Registry repository URL"
    value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker-repo.repository_id}"
}

output "frontend_bucket_name" {
    description = "The bucket name of where our frontend lives"
    value = google_storage_bucket.frontend_storage_bucket.name
}