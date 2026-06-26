resource "google_cloud_run_v2_service" "call-time" {
  name     = "call-time-cloud-run"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"
  template {
    service_account = var.service-account-email
    annotations     = {
      "run.googleapis.com/cloudsql-instances" = var.db-instance-connection-name
    }
    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello"
      ports {
        container_port = 8080
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
  }
  lifecycle {
    ignore_changes = [ template[0].containers[0].image ]
  }
}

resource "google_cloud_run_v2_service_iam_member" "cloud_run_service_member" {
  member = "allUsers"
  name = google_cloud_run_v2_service.call-time.name
  role = "roles/run.invoker"
  location = var.region
}