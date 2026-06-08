output "db_instance_connection_name" {
    description = "The connection name of the Cloud SQL instance"
    value = google_sql_database_instance.main_sql_instance.connection_name
}