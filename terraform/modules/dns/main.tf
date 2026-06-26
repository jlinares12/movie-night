resource "google_dns_managed_zone" "calltime" {
  name     = "calltime-dev-zone"
  dns_name = "${var.domain}."
}

resource "google_dns_record_set" "a_record" {
  name         = "${var.domain}."
  type         = "A"
  ttl          = 300
  managed_zone = google_dns_managed_zone.calltime.name
  rrdatas      = [ var.lb_ip ]
}
