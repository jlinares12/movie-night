output "name_servers" {
  value = var.create_zone ? google_dns_managed_zone.calltime[0].name_servers : data.google_dns_managed_zone.existing[0].name_servers
}

output "zone_name" {
  value = local.managed_zone_name
}