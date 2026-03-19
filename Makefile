.PHONY: build run shell test clean

build-cache:
	docker build -t ubuntu-uoa:latest .

build:
	docker build --no-cache -t ubuntu-uoa:latest .

run:
	docker-compose up -d

shell:
	docker-compose exec uoa-environment bash

stop:
	docker-compose down

clean:
	docker-compose down -v
	docker rmi ubuntu-uoa:latest

test:
	docker run --rm ubuntu-uoa:latest test

logs:
	docker-compose logs -f