resource "google_cloud_run_v2_service" "call-time" {
  name     = "call-time-cloud-run-${var.environment}"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"
  template {
    service_account = var.service_account_email
    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello"
      ports {
        container_port = 8080
      }
      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
      dynamic "env" {
        for_each = var.secret_ids
        content {
          name = upper(replace(env.key, "-", "_"))
          value_source {
            secret_key_ref {
              secret = env.value
              version = "latest"
            }
          }
        }
      }
    }
    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [ var.db_instance_connection_name ]
      }
    }
  }
  lifecycle {
    ignore_changes = [ template[0].containers[0].image ]
  }
}

resource "google_cloud_run_v2_service_iam_member" "cloud_run_service_member" {
  member    = "allUsers"
  name      = google_cloud_run_v2_service.call-time.name
  role      = "roles/run.invoker"
  location  = var.region
}