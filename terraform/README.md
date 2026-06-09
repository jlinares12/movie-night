<!-- BEGIN_TF_DOCS -->
## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_google"></a> [google](#requirement\_google) | ~> 5.0 |
| <a name="requirement_random"></a> [random](#requirement\_random) | ~> 3.0 |

## Providers

No providers.

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_sql"></a> [sql](#module\_sql) | ./modules/sql | n/a |
| <a name="module_storage"></a> [storage](#module\_storage) | ./modules/storage | n/a |

## Resources

No resources.

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_db_name"></a> [db\_name](#input\_db\_name) | Name of the PostgreSQL database | `string` | n/a | yes |
| <a name="input_db_password"></a> [db\_password](#input\_db\_password) | The Cloud SQL app user password | `string` | n/a | yes |
| <a name="input_db_user"></a> [db\_user](#input\_db\_user) | Name of the PostgreSQL app user | `string` | n/a | yes |
| <a name="input_deletion_protection"></a> [deletion\_protection](#input\_deletion\_protection) | States if we want to enable deletion protection | `bool` | n/a | yes |
| <a name="input_environment"></a> [environment](#input\_environment) | Name resources and toggle behaviors (dev or prod) | `string` | n/a | yes |
| <a name="input_project_id"></a> [project\_id](#input\_project\_id) | GCP project ID | `string` | n/a | yes |
| <a name="input_region"></a> [region](#input\_region) | Where to deploy resources | `string` | `"us-central1"` | no |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_artifact_registry"></a> [artifact\_registry](#output\_artifact\_registry) | Artifact Registry repository URL |
| <a name="output_db_instance_connection_name"></a> [db\_instance\_connection\_name](#output\_db\_instance\_connection\_name) | The connection name of the Cloud SQL instance |
| <a name="output_frontend_bucket_name"></a> [frontend\_bucket\_name](#output\_frontend\_bucket\_name) | The bucket name of where our frontend lives |
<!-- END_TF_DOCS -->