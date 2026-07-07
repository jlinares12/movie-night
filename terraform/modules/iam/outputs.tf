output "sql-service-account-email" {
  value = google_service_account.cloud-run-sa.email
}

output "cloud-build-service-account-email" {
  value = google_service_account.cloudbuild-sa.email
}