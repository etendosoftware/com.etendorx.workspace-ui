FROM etendo/compiler_jenkins:1.0.7-jdk.17.0.13

# Switch to root for package installation
USER root

# Install Node.js 24, pnpm, docker, and all Playwright/Chromium system dependencies
# so the Jenkins pipeline doesn't have to download them on every run.
RUN apt-get update -y -o Acquire::Retries=3 && \
    apt-get install -y --no-install-recommends --fix-missing \
      curl openssl ca-certificates gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g pnpm && \
    npx -y playwright@1.59.1 install-deps chromium && \
    npx -y playwright@1.59.1 install chromium && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
