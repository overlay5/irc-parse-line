node: ## Start a Node.js CLI in the container
	@docker-compose exec node sh -c 'cd app && node --experimental-repl-await --harmony'

node-shell: ## Start a Bash CLI in the container
	@docker-compose exec node sh -c 'cd app && bash'

test: ## Run Mocha unit testing in the container
	@docker-compose exec node sh -c 'cd app && npm run test'

test-watch: ## Run Mocha watcher in the container
	@docker-compose exec node sh -c 'cd app && npm run test:watch'

lint: ## Run ESLint on the code
	@docker-compose exec node sh -c 'cd app && npm run lint'

npm-outdated: ## Check for outdated npm packages
	@docker-compose exec node sh -c 'cd app && npm outdated'

.PHONY: help test lint node node-shell

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
