resource "google_cloudbuildv2_connection" "github" {
  location = var.region
  name     = "github-connection"

  github_config {
    app_installation_id = var.github_app_installation_id
    authorizer_credential {
      oauth_token_secret_version = var.github_oauth_token_secret_version
    }
  }
}

resource "google_cloudbuildv2_repository" "app" {
  location = var.region
  name = "call-time"
  parent_connection = google_cloudbuildv2_connection.github.name
  remote_uri = var.github_repo_url
}
