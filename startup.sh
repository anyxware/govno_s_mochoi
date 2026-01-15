docker run --name postgres-zis -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=postgres -d -p 5432:5432 postgres
docker run --name postgres-zis-int -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=postgres -d -p 5433:5432 postgres
