resource "google_compute_region_network_endpoint_group" "cloudrun_neg" {
  name                  = "cloudrun-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.service_location
  cloud_run {
    service = var.cloud_run_name
  }
}

resource "google_compute_backend_service" "cloud_run_backend" {
  name                  = "call-time-api-backend"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  backend {
    group = google_compute_region_network_endpoint_group.cloudrun_neg.id
  }
}

resource "google_compute_url_map" "cloud_run_url_map" {
  name            = "cloud-run-url-map"
  default_service = google_compute_backend_bucket.frontend_gcs_bucket_backend.id

  host_rule {
    hosts        = [ "*" ]
    path_matcher = "allpaths"
  }

  path_matcher {
    name            = "allpaths"
    default_service = google_compute_backend_bucket.frontend_gcs_bucket_backend.id
    path_rule {
      paths   = [ "/api/*" ]
      service = google_compute_backend_service.cloud_run_backend.id
    }
  }
}

resource "google_compute_url_map" "http_to_https_url_map" {
  name = "https-redirect-url-map"
  default_url_redirect {
    https_redirect = true
    strip_query = false
  }
}

resource "google_compute_backend_bucket" "frontend_gcs_bucket_backend" {
  name        = "frontend-gcs-backend-bucket"
  bucket_name = var.frontend_bucket_name
  enable_cdn  = true
}

resource "google_compute_managed_ssl_certificate" "ssl_certificate" {
  name = "call-time-ssl-certs"
  managed {
    domains = [ var.domain ]
  }
}

resource "google_compute_target_https_proxy" "https_proxy" {
  name             = "call-time-https-proxy"
  url_map          = google_compute_url_map.cloud_run_url_map.id
  ssl_certificates = [ google_compute_managed_ssl_certificate.ssl_certificate.id ]
}

resource "google_compute_target_http_proxy" "http_proxy" {
  name    = "call-time-http-proxy"
  url_map = google_compute_url_map.http_to_https_url_map.id
}

resource "google_compute_global_address" "lb_ip" {
  name = "call-time-lb-ip"
}

resource "google_compute_global_forwarding_rule" "https" {
  name                  = "call-time-https-rule"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  port_range            = "443"
  target                = google_compute_target_https_proxy.https_proxy.id
  ip_address            = google_compute_global_address.lb_ip.id
}

resource "google_compute_global_forwarding_rule" "http" {
  name                  = "call-time-http-rule"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  port_range            = "80"
  target                = google_compute_target_http_proxy.http_proxy.id
  ip_address            = google_compute_global_address.lb_ip.id
}