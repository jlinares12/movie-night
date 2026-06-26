# Terraform workflow for the Call Time infra.
# Usage:
#   make dev  init                       # init backend for the dev env
#   make dev  plan                       # plan dev
#   make dev  apply                      # apply dev
#   make dev  plan  TARGET=module.secrets   # plan only one module
#   make prod plan                       # same, prod env
#
# `dev` / `prod` are env-selector goals (they do nothing on their own);
# `init` / `plan` / `apply` are the real actions and read the selected env.

# Default env if neither `dev` nor `prod` is named on the command line.
ENV := dev
ifneq (,$(filter prod,$(MAKECMDGOALS)))
  ENV := prod
endif

# Optional: `make dev plan TARGET=module.secrets` -> adds `-target=module.secrets`
TARGET ?=
TARGET_FLAG := $(if $(TARGET),-target=$(TARGET),)

# Both var-files: non-secret config + the git-ignored secrets file.
VAR_FILES := -var-file=envs/$(ENV).tfvars -var-file=envs/$(ENV).secrets.tfvars

.PHONY: dev prod init plan apply fmt validate

# Env selectors: no-op recipes whose only job is to put `dev`/`prod`
# on the command line so the ENV logic above can read it.
dev prod:
	@:

init:
	terraform init -reconfigure -backend-config=envs/$(ENV).backend.tfvars

plan:
	terraform plan $(VAR_FILES) $(TARGET_FLAG)

apply:
	terraform apply $(VAR_FILES) $(TARGET_FLAG)

fmt:
	terraform fmt -recursive

validate:
	terraform validate
