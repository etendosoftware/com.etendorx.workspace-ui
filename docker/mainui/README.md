## How to Build the `etendo_ui` Image

### 1. Build the Docker Image

To create the `etendo_ui` Docker image, execute the following command:  

```sh
docker buildx build -f docker/mainui/Dockerfile -t etendo/mainui:custom .
```

This command uses the `Dockerfile` located in `docker/mainui/` to build the image with the tag `etendo/mainui:custom`.  

---

That's it! Your `etendo_ui` image is now ready to use.
