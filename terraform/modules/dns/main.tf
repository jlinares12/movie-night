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
  rrdatas      = [var.lb_ip]
}

resource "google_dns_record_set" "www_a_record" {
  name         = "www.${var.domain}."
  type         = "A"
  ttl          = 300
  managed_zone = local.managed_zone_name
  rrdatas      = [var.lb_ip]
}

# Clerk (prod auth) records. Scoped to var.create_zone so only the prod
# invocation of this module (which owns the calltime.dev apex) creates
# them — dev's invocation of this same module (for devel.calltime.dev)
# should not attempt to create sibling records in the shared zone.
resource "google_dns_record_set" "clerk_accounts_cname" {
  count        = var.create_zone ? 1 : 0
  name         = "accounts.${var.domain}."
  type         = "CNAME"
  ttl          = 300
  managed_zone = local.managed_zone_name
  rrdatas      = ["accounts.clerk.services."]
}

resource "google_dns_record_set" "clerk_frontend_cname" {
  count        = var.create_zone ? 1 : 0
  name         = "clerk.${var.domain}."
  type         = "CNAME"
  ttl          = 300
  managed_zone = local.managed_zone_name
  rrdatas      = ["frontend-api.clerk.services."]
}

resource "google_dns_record_set" "clerk_dkim1_cname" {
  count        = var.create_zone ? 1 : 0
  name         = "clk._domainkey.${var.domain}."
  type         = "CNAME"
  ttl          = 300
  managed_zone = local.managed_zone_name
  rrdatas      = ["dkim1.qff0pp8vscz7.clerk.services."]
}

resource "google_dns_record_set" "clerk_dkim2_cname" {
  count        = var.create_zone ? 1 : 0
  name         = "clk2._domainkey.${var.domain}."
  type         = "CNAME"
  ttl          = 300
  managed_zone = local.managed_zone_name
  rrdatas      = ["dkim2.qff0pp8vscz7.clerk.services."]
}

resource "google_dns_record_set" "clerk_mail_cname" {
  count        = var.create_zone ? 1 : 0
  name         = "clkmail.${var.domain}."
  type         = "CNAME"
  ttl          = 300
  managed_zone = local.managed_zone_name
  rrdatas      = ["mail.qff0pp8vscz7.clerk.services."]
}