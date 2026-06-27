# Visual Schedules — Build & Deploy
# Usage: make deploy | make dev | make db-migrate

CLOUDFLARE_API_TOKEN ?= $(shell echo $$CLOUDFLARE_API_TOKEN)
export CLOUDFLARE_API_TOKEN

# ─── Development ───

.PHONY: dev
dev: ## Start local dev server
	npx next dev -p 3456

.PHONY: build
build: ## Build Next.js locally (check for errors)
	npx next build

.PHONY: lint
lint: ## Run linter + type check
	npx eslint . && npx tsc --noEmit

# ─── Database ───

.PHONY: db-generate
db-generate: ## Generate new D1 migration from schema changes
	npx drizzle-kit generate

.PHONY: db-migrate-local
db-migrate-local: ## Apply migrations to local D1
	npx wrangler d1 migrations apply visual-schedules-db --local

.PHONY: db-migrate
db-migrate: ## Apply migrations to remote D1
	npx wrangler d1 migrations apply visual-schedules-db --remote

.PHONY: db-seed
db-seed: ## Seed card data from cards-data.js
	node scripts/parse-cards.mjs

.PHONY: db-seed-admin
db-seed-admin: ## Create admin user in remote D1
	npx wrangler d1 execute visual-schedules-db --remote --file=scripts/seed-admin.sql

.PHONY: db-seed-admin-local
db-seed-admin-local: ## Create admin user in local D1
	npx wrangler d1 execute visual-schedules-db --local --file=scripts/seed-admin.sql

# ─── Deploy ───

.PHONY: deploy
deploy: ## Full build + deploy to Cloudflare
	@echo "→ Building Next.js..."
	npx next build
	@echo "→ Building for Cloudflare..."
	npx opennextjs-cloudflare build
	@echo "→ Deploying..."
	npx wrangler deploy
	@echo "✅ Deployed"

.PHONY: deploy-quick
deploy-quick: ## Deploy without Next.js rebuild (uses existing .next)
	npx opennextjs-cloudflare build
	npx wrangler deploy

.PHONY: deploy-preview
deploy-preview: ## Deploy to preview (non-production)
	npx next build
	npx opennextjs-cloudflare build
	npx wrangler deploy --env preview

# ─── Secrets ───

.PHONY: secrets
secrets: ## Set production secrets
	@echo "Setting BETTER_AUTH_SECRET..."
	@npx wrangler secret put BETTER_AUTH_SECRET
	@echo "Setting RESEND_API_KEY..."
	@npx wrangler secret put RESEND_API_KEY

# ─── Utilities ───

.PHONY: logs
logs: ## Tail production logs
	npx wrangler tail

.PHONY: status
status: ## Show deployment info
	npx wrangler deployments list

.PHONY: clean
clean: ## Remove build artifacts
	rm -rf .next .open-next node_modules/.cache

.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
