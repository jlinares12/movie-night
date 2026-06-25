output "secret_ids" {
  description = "Map of bare secret name to its Secret Manager secret_id"
    value = { for name, secret in google_secret_manager_secret.call-time-secrets : name => secret.secret_id }
}