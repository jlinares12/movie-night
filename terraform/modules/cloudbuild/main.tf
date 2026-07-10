locals {
  envs = {
    dev = {
      branch              = "^dev$"
      cloudbuild_sa_email = "dev-cloudbuild-sa@${var.project_id}.iam.gserviceaccount.com"
      service_name        = "call-time-cloud-run-dev"
      migrate_job         = "call-time-migrate-dev" # PENDING: no google_cloud_run_v2_job exists yet — see modules/run gap
      frontend_bucket     = "${var.project_id}-dev-frontend-bucket"
      artifact_repo       = "${var.project_id}-dev-artifact-registry"
      domain              = var.dev_domain
    }
    prod = {
      branch              = "^main$"
      cloudbuild_sa_email = "prod-cloudbuild-sa@${var.project_id}.iam.gserviceaccount.com"
      service_name        = "call-time-cloud-run-prod"
      migrate_job         = "call-time-migrate-prod" # PENDING: see above
      frontend_bucket     = "${var.project_id}-prod-frontend-bucket"
      artifact_repo       = "${var.project_id}-prod-artifact-registry"
      domain              = var.prod_domain
    }
  }
}

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
  location          = var.region
  name              = "call-time"
  parent_connection = google_cloudbuildv2_connection.github.name
  remote_uri        = var.github_repo_url
}

resource "google_cloudbuild_trigger" "backend" {
  for_each        = local.envs
  name            = "${each.key}-backend"
  location        = var.region
  service_account = "projects/${var.project_id}/serviceAccounts/${each.value.cloudbuild_sa_email}"
  filename        = "cloudbuild/backend.yaml"

  repository_event_config {
    repository = google_cloudbuildv2_repository.app.id
    push {
      branch = each.value.branch
    }
  }

  included_files = ["api/**", "cloudbuild/backend.yaml", "trigger-builds/all/**", "trigger-builds/backend/**"]

  substitutions = {
    _ENV            = each.key
    _SERVICE_NAME   = each.value.service_name
    _MIGRATE_JOB    = each.value.migrate_job
    _REGION         = var.region
    _DOMAIN         = each.value.domain
    _ARTIFACT_REPO  = each.value.artifact_repo
  }
}

resource "google_cloudbuild_trigger" "frontend" {
  for_each        = local.envs
  name            = "${each.key}-frontend"
  location        = var.region
  service_account = "projects/${var.project_id}/serviceAccounts/${each.value.cloudbuild_sa_email}"
  filename        = "cloudbuild/frontend.yaml"

  repository_event_config {
    repository = google_cloudbuildv2_repository.app.id
    push {
      branch = each.value.branch
    }
  }

  included_files = ["src/**", "package.json", "package-lock.json", "cloudbuild/frontend.yaml", "trigger-builds/all/**", "trigger-builds/frontend/**"]

  substitutions = {
    _ENV    = each.key
    _BUCKET = each.value.frontend_bucket
  }
}