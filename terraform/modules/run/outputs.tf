output "cloud-run-service-name" {
  value = google_cloud_run_v2_service.call-time.name
}

output "service-location" {
  value = google_cloud_run_v2_service.call-time.location
}

output "cloud_run_url" {
  value = google_cloud_run_v2_service.call-time.uri
}
