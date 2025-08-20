#!/bin/bash

# Script to update docker-compose to use a specific UI version
# Usage: ./scripts/update-ui-version.sh <version>
# Example: ./scripts/update-ui-version.sh 1.2.3

set -e

if [ $# -eq 0 ]; then
    echo "Usage: $0 <version>"
    echo "Example: $0 1.2.3"
    exit 1
fi

VERSION=$1

# Validate version format (basic check)
if [[ ! $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+.*$ ]]; then
    echo "Warning: Version '$VERSION' doesn't follow semantic versioning (x.y.z)"
    echo "Continuing anyway..."
fi

echo "Updating UI version to: $VERSION"

# Update .env file if it exists
if [ -f ".env" ]; then
    if grep -q "^UI_VERSION=" .env; then
        sed -i "s/^UI_VERSION=.*/UI_VERSION=$VERSION/" .env
        echo "Updated UI_VERSION in .env file"
    else
        echo "UI_VERSION=$VERSION" >> .env
        echo "Added UI_VERSION to .env file"
    fi
else
    echo "Creating .env file with UI_VERSION=$VERSION"
    echo "UI_VERSION=$VERSION" > .env
    if [ -f ".env.example" ]; then
        echo "# Additional variables - see .env.example for details" >> .env
    fi
fi

echo "✅ Docker Compose is now configured to use UI version: $VERSION"
echo ""
echo "To deploy:"
echo "  docker-compose pull etendo_ui"
echo "  docker-compose up -d etendo_ui"