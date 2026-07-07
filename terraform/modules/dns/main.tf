resource "google_dns_managed_zone" "calltime" {
  count    = var.create_zone ? 1 : 0
  name     = "calltime-dev-zone"
  dns_name = "${var.domain}."
}

data "google_dns_managed_zone" "existing" {
  count = var.create_zone ? 0 : 1
  name  = "calltime-dev-zone"
}

locals {
  managed_zone_name = var.create_zone ? google_dns_managed_zone.calltime[0].name : data.google_dns_managed_zone.existing[0].name
}

resource "google_dns_record_set" "a_record" {
  name         = "${var.domain}."
  type         = "A"
  ttl          = 300
  managed_zone = local.managed_zone_name
  rrdatas      = [ var.lb_ip ]
}
