output "cloudbuild_service_account_email" {
  value = google_service_account.cloudbuild.email
}

output "repository_id" {
  value = google_cloudbuildv2_repository.app.id
}