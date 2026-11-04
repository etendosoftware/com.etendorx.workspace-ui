# Image of the Playwright Jenkins pipeline (jenkins-pipelines playwright-automation).
# Base: the Etendo GO agent image on Ubuntu 24.04 (ETP-6044), which local-env needs to
# build the ERP from its shared DB snapshot cache: the non-root ci user (its embedded
# PostgreSQL refuses root), curl 8.5 (the S3 cache is signed with --aws-sigv4) and a
# Gradle home ci can write. It also brings JDK 17, git, wget, docker CLI and Tomcat.
FROM etendo/etendo-go:localenv-noble

USER root

# Node.js 24 and pnpm for the UI build; procps for ps in pnpm-start.sh
RUN apt-get update -y -o Acquire::Retries=3 && \
    apt-get install -y --no-install-recommends procps && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g pnpm && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# The Chromium of the @playwright/test version the tests pin, next to the base image's
# one in PLAYWRIGHT_BROWSERS_PATH (each Playwright version looks for its own build)
RUN npx -y playwright@1.59.1 install --with-deps chromium && \
    npm cache clean --force && rm -rf /tmp/* && \
    chmod -R 755 "$PLAYWRIGHT_BROWSERS_PATH"
