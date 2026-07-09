# Terraform workflow for the Call Time infra.
# Usage:
#   make dev    init                       # init backend for the dev env
#   make dev    plan                       # plan dev
#   make dev    apply                      # apply dev
#   make dev    plan  TARGET=module.secrets   # plan only one module
#   make prod   plan                       # same, prod env
#   make shared plan                       # plans terraform/shared (the shared LB)
#
# `dev` / `prod` / `shared` are env-selector goals (they do nothing on their own);
# `init` / `plan` / `apply` are the real actions and read the selected env.
# Default env if none is named on the command line.
ENV := dev
ifneq (,$(filter prod,$(MAKECMDGOALS)))
ENV := prod
endif
ifneq (,$(filter shared,$(MAKECMDGOALS)))
ENV := shared
endif

# shared lives in its own subdirectory; dev/prod run against the root module (".")
CHDIR := $(if $(filter shared,$(ENV)),shared,.)

# Optional: `make dev plan TARGET=module.secrets` -> adds `-target=module.secrets`
TARGET ?=
TARGET_FLAG := $(if $(TARGET),-target=$(TARGET),)

# shared has no secrets var-file; dev/prod do. Paths are relative to CHDIR,
# so shared's need an extra `../` to reach the top-level envs/ directory.
ifeq ($(ENV),shared)
VAR_FILES := -var-file=../envs/shared.tfvars -var-file=../envs/shared.secrets.tfvars
BACKEND_CONFIG := ../envs/shared.backend.tfvars
else
VAR_FILES := -var-file=envs/$(ENV).tfvars -var-file=envs/$(ENV).secrets.tfvars
BACKEND_CONFIG := envs/$(ENV).backend.tfvars
endif

.PHONY: dev prod shared init plan apply fmt validate

dev prod shared:
	@:

init:
	terraform -chdir=$(CHDIR) init -reconfigure -backend-config=$(BACKEND_CONFIG)
plan:
	terraform -chdir=$(CHDIR) plan $(VAR_FILES) $(TARGET_FLAG)
apply:
	terraform -chdir=$(CHDIR) apply $(VAR_FILES) $(TARGET_FLAG)
fmt:
	terraform fmt -recursive
validate:
	terraform -chdir=$(CHDIR) validate
