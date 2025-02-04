## How to build the `etendo_db` image

### 1. Build the Docker Image

To build the initial database image, execute:

```sh
docker buildx build -t etendo/etendo_db .
```

This will create a container based on postgres:16 as defined in the Dockerfile.

### 2. Run the Container

Before proceeding, ensure that no PostgreSQL server is running on your machine to prevent port conflicts. Then, start the container with:

```sh
docker run -e POSTGRES_DB=postgres \
           -e POSTGRES_USER=postgres \
           -e POSTGRES_PASSWORD=syspass \
           -p 5432:5432 \
           etendo/etendo_db
```

### 3. Install Etendo

Now, follow the installation steps for **Etendo Classic** as described in the [official documentation](https://docs.etendo.software/getting-started/installation). Install the following modules:

- `com.etendoerp.etendorx`
- `com.etendoerp.metadata`
- `com.etendoerp.metadata.template`
- `com.etendoerp.openapi`

### 4. Configure Secure Web Services (SWS)

Once Etendo is successfully installed, start it and configure **Secure Web Services (SWS)** in the **"Client"** window while logged in as **System Admin**.

### 5. Save the Container as an Image

Finally, to persist the installed configuration, commit the running container as a new image:

```sh
docker commit <container_id> etendo/etendo_db:custom
```

To find the container ID, use:

```sh
docker ps
```

Now, your `etendo_db` image is ready to be reused.
