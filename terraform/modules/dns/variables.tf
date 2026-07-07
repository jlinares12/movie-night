variable "domain" {
  type = string
}

variable "lb_ip" {
  type = string
}

variable "create_zone" {
  type = bool
  default = false
}