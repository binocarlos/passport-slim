mkfile_path := $(abspath $(lastword $(MAKEFILE_LIST)))
current_dir := $(dir $(mkfile_path)))

.PHONY: frontend.image
frontend.image:
	docker build -t binocaros/passport-slim-frontend-build -f example/frontend/Dockerfile.build example/frontend

.PHONY: frontend.build
frontend.build: frontend.image
	bash example/buildfrontend.sh build

.PHONY: frontend.watch
frontend.watch:
	bash example/buildfrontend.sh watch

.PHONY: auth.dev
auth.dev:
	bash example/rundevauth.sh

.PHONY: userstorage.dev
userstorage.dev:
	bash example/rundevuserstorage.sh