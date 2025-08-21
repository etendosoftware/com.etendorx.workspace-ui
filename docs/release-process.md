# Release Process

This document describes the release process for Etendo WorkspaceUI.

## Creating a New Release

### 1. Prepare the Release

1. Ensure all changes are merged to `develop` branch
2. Update version numbers in `package.json` files if needed
3. Update CHANGELOG.md (if exists) with release notes
4. Test the build locally:
   ```bash
   pnpm build
   ```

### 2. Create and Push the Tag

```bash
# Create annotated tag
git tag -a v1.2.3 -m "Release version 1.2.3"

# Push the tag to trigger Docker build
git push origin v1.2.3
```

### 3. Automatic Docker Build

When the tag is pushed:
- GitHub Actions automatically triggers the Docker build workflow
- Docker image is built for multiple platforms (linux/amd64, linux/arm64)
- Image is tagged with both the version number and `latest`:
  - `etendo/etendo_ui:1.2.3`
  - `etendo/etendo_ui:latest`

### 4. Deploy the Release

Users can deploy the new version using:

```bash
# Update to specific version
./scripts/update-ui-version.sh 1.2.3

# Pull and deploy
docker compose pull etendo_ui
docker compose up -d etendo_ui
```

## Version Naming

- Use semantic versioning: `MAJOR.MINOR.PATCH`
- Tag format: `v1.2.3` or `1.2.3` (both work)
- Examples: `v0.2.0`, `1.0.0`, `2.1.3`

## Notes

- Only tags trigger Docker builds (not branch pushes)
- Each release gets a permanent, versioned Docker image
- The `latest` tag always points to the most recent release
- Users should pin to specific versions in production environments