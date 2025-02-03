## How to Build the `etendo_classic` Image

### 1. Prepare the Application Files

1. Follow the installation steps for **Etendo Classic** as described in the [official documentation](https://docs.etendo.software/getting-started/installation). Install the following modules:

- `com.etendoerp.etendorx`
- `com.etendoerp.metadata`
- `com.etendoerp.metadata.template`
- `com.etendoerp.openapi`


2. Copy and paste the contents of the `$CATALINA_BASE/webapps/etendo` folder into `docker/tomcat/etendo`.  
   Ensure the structure within `docker/tomcat/etendo` matches the structure of your original `etendo` folder.  

3. Update the `Openbravo.properties` file located at `docker/tomcat/etendo/WEB-INF/Openbravo.properties` with the following values:  

   ```properties
   bbdd.url=${BBDD_URL}
   bbdd.sid=${BBDD_SID}
   bbdd.systemUser=${BBDD_SYSTEM_USER}
   bbdd.systemPassword=${BBDD_SYSTEM_PASSWORD}
   ```

   These values will be dynamically replaced when the container starts.

---

### 2. Build the Docker Image

To create the Docker image for `etendo_classic`, run the following command:

```sh
docker buildx build -t etendo/etendo_classic .
```

This builds the image based on Tomcat, as defined in the Dockerfile.

---

### 3. Run the Container

Run the container with the following command, ensuring all required environment variables are passed:  

```sh
docker run -e BBDD_URL=jdbc:postgresql://<db_host>:5432/<db_name> \
           -e BBDD_SID=<db_sid> \
           -e BBDD_SYSTEM_USER=postgres \
           -e BBDD_SYSTEM_PASSWORD=syspass \
           -p 8080:8080 \
           etendo/etendo_classic
```

Replace `<db_host>`, `<db_name>`, and `<db_sid>` with your actual database connection details.

---

### 4. Verify the Application

Once the container is running, access the application by navigating to:  
`http://<host>:8080/etendo`  

Ensure that the application connects correctly to the database and functions as expected.

---

### 5. Save the Container as an Image

To persist the configured `etendo_classic` setup, commit the running container as a new Docker image:  

```sh
docker commit <container_id> etendo/etendo_classic:custom
```

Use the following command to locate the container ID:  

```sh
docker ps
```

Your customized `etendo_classic` Docker image is now ready for reuse.
