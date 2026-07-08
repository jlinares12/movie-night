# --- Dev backend chain ---
resource "google_compute_region_network_endpoint_group" "dev_cloudrun_neg" {
  name                  = "cloudrun-neg-dev"
  network_endpoint_type = "SERVERLESS"
  region                = var.service_location
  cloud_run {
    service = var.dev_cloud_run_name
  }
}

resource "google_compute_backend_service" "dev_cloud_run_backend" {
  name                  = "call-time-api-backend-dev"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  backend {
    group = google_compute_region_network_endpoint_group.dev_cloudrun_neg.id
  }
}

resource "google_compute_backend_bucket" "dev_frontend_gcs_bucket_backend" {
  name        = "frontend-gcs-backend-bucket-dev"
  bucket_name = var.dev_frontend_bucket_name
  enable_cdn  = true
}

# --- Prod backend chain ---
resource "google_compute_region_network_endpoint_group" "prod_cloudrun_neg" {
  name                  = "cloudrun-neg-prod"
  network_endpoint_type = "SERVERLESS"
  region                = var.service_location
  cloud_run {
    service = var.prod_cloud_run_name
  }
}

resource "google_compute_backend_service" "prod_cloud_run_backend" {
  name                  = "call-time-api-backend-prod"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  backend {
    group = google_compute_region_network_endpoint_group.prod_cloudrun_neg.id
  }
}

resource "google_compute_backend_bucket" "prod_frontend_gcs_bucket_backend" {
  name        = "frontend-gcs-backend-bucket-prod"
  bucket_name = var.prod_frontend_bucket_name
  enable_cdn  = true
}

# --- Shared: host-based routing on one url map ---
resource "google_compute_url_map" "cloud_run_url_map" {
  name = "cloud-run-url-map"

  default_service = google_compute_backend_bucket.prod_frontend_gcs_bucket_backend.id

  host_rule {
    hosts        = [var.prod_domain]
    path_matcher = "prod-paths"
  }

  host_rule {
    hosts        = [var.dev_domain]
    path_matcher = "dev-paths"
  }

  host_rule {
    hosts        = ["www.${var.prod_domain}"]
    path_matcher = "prod-www-redirect"
  }

  host_rule {
    hosts        = ["www.${var.dev_domain}"]
    path_matcher = "dev-www-redirect"
  }

  path_matcher {
    name = "prod-www-redirect"
    default_url_redirect {
      host_redirect = var.prod_domain
      https_redirect = true
      strip_query    = false
    }
  }

  path_matcher {
    name = "dev-www-redirect"
    default_url_redirect {
      host_redirect = var.dev_domain
      https_redirect = true
      strip_query    = false
    }
  }

  path_matcher {
    name            = "prod-paths"
    default_service = google_compute_backend_bucket.prod_frontend_gcs_bucket_backend.id
    path_rule {
      paths   = ["/api/*"]
      service = google_compute_backend_service.prod_cloud_run_backend.id
    }
  }

  path_matcher {
    name            = "dev-paths"
    default_service = google_compute_backend_bucket.dev_frontend_gcs_bucket_backend.id
    path_rule {
      paths   = ["/api/*"]
      service = google_compute_backend_service.dev_cloud_run_backend.id
    }
  }
}

resource "google_compute_url_map" "http_to_https_url_map" {
  name = "https-redirect-url-map"
  default_url_redirect {
    https_redirect = true
    strip_query    = false
  }
}

# --- SSL Certificates for each domain ---
resource "google_compute_managed_ssl_certificate" "prod_ssl_certificate" {
  name = "calltime-prod-ssl-certs-v2"
  managed {
    domains = [var.prod_domain, "www.${var.prod_domain}"]
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "google_compute_managed_ssl_certificate" "dev_ssl_certificate" {
  name = "calltime-dev-ssl-certs-v2"
  managed {
    domains = [var.dev_domain, "www.${var.dev_domain}"]
  }

  lifecycle {
    create_before_destroy = true
  }
}

# --- HTTPS Proxy with both certificates ---
resource "google_compute_target_https_proxy" "https_proxy" {
  name             = "call-time-https-proxy"
  url_map          = google_compute_url_map.cloud_run_url_map.id
  ssl_certificates = [
    google_compute_managed_ssl_certificate.prod_ssl_certificate.id,
    google_compute_managed_ssl_certificate.dev_ssl_certificate.id
  ]

  lifecycle {
    create_before_destroy = true
  }
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