### docker-compose and other scripts to get running Eetendo Classic(with metadata, openapi and etendorx modules) and MainUI next.js frontend

# How to

## Build and start containers
First of all, you will need to add the missing files: 
- docker/tomcat/etendo.war
- docker/db/backup.sql

These files can be found at: https://drive.google.com/drive/folders/1QjFWT3ofthVnt_6QR7Xk7WktWnzIys8E?usp=sharing

Then, you can build and run the containers with:
```
FORCE_INIT_DB=true docker compose up --build --detach
```

## Stop containers
```
docker compose down -v
```


# Common issues

## Missing database info
You can force the backup restoration, having the containers running and then executing the following command:
```
docker exec -i postgres_db psql -U tad -d etendo < docker/db/backup.sql
```
