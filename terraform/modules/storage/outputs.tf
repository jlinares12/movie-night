output "artifact_registry" {
    description = "Artifact Registry repository URL"
    value = google_artifact_registry_repository.docker-repo.id
}

output "frontend_bucket_name" {
    description = "The bucket name of where our frontend lives"
    value = google_storage_bucket.frontend_storage_bucket.name
}