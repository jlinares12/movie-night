# No longer need random_id since we're using predictable names
# resource "random_id" "call_time_db_id" {
#   byte_length = 4
# }

resource "google_sql_database_instance" "main_sql_instance" {
    name                = "calltime-postgres-${var.environment}"
    database_version    = "POSTGRES_16"
    region              = var.region
    project             = var.project_id
    deletion_protection = var.deletion_protection

    settings {
        tier                        = "db-f1-micro"
        deletion_protection_enabled = var.deletion_protection

        backup_configuration {
          enabled            = true
          start_time = "03:00"
        }
    }
}

resource "google_sql_database" "call_time_db" {
    name     = var.db_name
    instance = google_sql_database_instance.main_sql_instance.name
}

resource "google_sql_user" "users" {
    name     = var.db_user
    instance = google_sql_database_instance.main_sql_instance.name
    password = var.db_password
}