# WorkspaceUI Monorepo

## Workflow for a monorepo with pnpm and submodules (dev environment)

### Install pnpm

Install pnpm globally if you haven't already.

```bash
npm install -g pnpm
```

or using brew (MacOS)

```bash
brew install pnpm
```

### Install packages using pnpm

```bash
pnpm install
```

### Setup environment
You will need to define 4 environment variables at packages/MainUI/.env. It should look something like this:

```sh
NEXT_PUBLIC_API_BASE_URL="http://localhost:8080/etendo"
NEXT_PUBLIC_CACHE_DURATION="3600000"
NEXT_PUBLIC_AUTH_HEADER_NAME="Authorization"
```

The NEXT_PUBLIC_API_BASE_URL must point to a working Etendo Classic app.
The NEXT_PUBLIC_CACHE_DURATION is a configuration for the Metadata module. This setting represents the expiration time of cache entries and is a number in milliseconds.
The NEXT_PUBLIC_AUTH_HEADER_NAME is a configuration for the Metadata module. This settings represents the name of the header that will be used by the API client. Specifically, it will be used for sending the authentication token. 

### Running the app

In dev mode:
```bash
 pnpm dev
```

In production mode
```bash
 pnpm build
 pnpm start
```

## Storybook dev and build correctly

**Note:** This use both pnpm and yarn, so first of all we'll be working inside ./packages/storybook

```bash
  rm -rf node_modules
  rm -rf storybook-static
  yarn cache clean
  yarn install
  yarn build
  pnpm install
  yarn build
```

We can now run dev enviroment and build correctly

```bash
  yarn storybook
```
