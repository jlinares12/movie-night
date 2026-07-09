resource "google_secret_manager_secret" "call-time-secrets" {
  for_each  = toset(var.secret_names)
  project   = var.project_id
  secret_id = "call-time-${var.environment}-${each.key}"
  replication {
    auto {}
  }
}