.PHONY: help setup run check

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: ## Install required Ansible collections
	ansible-galaxy collection install community.general

run: ## Run the playbook
	ansible-playbook playbook.yml --ask-become-pass

check: ## Dry run - show what would change without applying
	ansible-playbook playbook.yml --check --diff --ask-become-pass
