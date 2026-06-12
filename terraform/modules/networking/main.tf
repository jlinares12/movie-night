resource "google_compute_global_address" "lb-ip" {
  name         = "${var.environment}-static-ip"
  project      = var.project_id
  address_type = "EXTERNAL"
}