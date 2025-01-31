docker exec -i postgres_db psql -U tad -d etendo < docker/db/backup.sql
docker compose up -v
docker compose down -v
