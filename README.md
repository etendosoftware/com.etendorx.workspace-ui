# WorkspaceUI Monorepo

## Workflow for a monorepo with pnpm and submodules (dev environment)

Note: This project is part of Etendo

### 1- Clone the repository

**Note:** This repository must be cloned in the modules_rx folder.

```bash
git clone <repository-url>
```

### 1.1- Install pnpm

Install pnpm globally if you haven't already.

```bash
npm install -g pnpm
```

or using brew (MacOS)

```bash
brew install pnpm
```

### 2- Install packages using pnpm

```bash
pnpm install
```

### 2.2- Setup environment
You will need to define 4 environment variables. You can use the following template (./packages/MainUI/.env.template) and paste its content in a .env file placed at the ./packages/MainUI/. It should look something like this:

```sh
VITE_API_BASE_URL="http://localhost:8080/etendo" # Etendo Classic URL
VITE_CACHE_DURATION="3600000" # miliseconds: 1 hour
VITE_AUTH_HEADER_NAME="Authorization"
```

The API_BASE_URL must point to a working Etendo Classic app.
The CACHE_DURATION is a configuration for the Metadata module. This setting represents the expiration time of cache entries and is a number in milliseconds.
The AUTH_HEADER_NAME is a configuration for the Metadata module. This settings represents the name of the header that will be used by the API client. Specifically, it will be used for sending the authentication token. 

### 3- Production Mode

install in a Etendo environment:

```bash
 pnpm build:all
```

run UI service

```bash
 ./gradlew :com.etendorx.workspace-ui:bootRun
```

### 3a- Production Mode

If have is an old clone of the repository is recommended to do

```bash
 pnpm clear
 pnpm build:all
```

### 3b- Run the main repository

```bash
pnpm dev
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

## Add a new package to the workspace (from scratch)

### 1- Add the new package to the workspace

```bash
npm init vite@latest NameOfProject -- --template react-ts
```

### 2- Change the name of the package in the package.json file to the following format:

```json
{
  "name": "@workspaceui/nameOfProject",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  ...
}
```

### 3- In the root of the workspace, run the following command to add the new package to the main workspace:

```bash
pnpm install
```

### 4- Add the new package to the .gitmodules file

```.gitmodules
[submodule "packages/nameOfProject"]
  path = packages/nameOfProject
  url = <repository-url>
```

### 5- Push the changes to the repository

```bash
git add . && git commit -m "Add new package to the workspace" && git push
```

## Aditional commands:

### - To update all submodules

In the root of the workspace, run the following command:

```bash
git submodule update --recursive --remote
```

**Note:** This command will update all submodules to the latest commit in the remote repository. The workspace tracks the latest commit in the main repository, so you will have to commit the changes in the workspace after running this command.
This is an important step to keep all submodules in sync with the workspace repository.

### - To install any library in a specific package (from the workspace root) run:

```bash
pnpm --filter @workspaceui/componentlibrary add @mui/utils
```

or navigate to the package folder and run:

```bash
pnpm add @mui/utils
```

## Steps to create a monorepo with pnpm and submodules (from scratch)

### 1- Create a new repository

```bash
git init
```

#### 1.1- Install pnpm

Install pnpm globally if you haven't already.

```bash
npm install -g pnpm
```

### 2- Init pnpm workspace

```bash
pnpm init
```

### 3- Add typescript to pnpm workspaces

```bash
pnpm add -D typescript ts-node -w
```

### 4- Configure pnpm-workspace.yaml

At the root of your workspace repository, create or update the pnpm-workspace.yaml to include paths to your submodules.

```yml
packages:
  - packages/\*
```

### 5- Add submodules to the repository

In this case, all repositories are builded as a Vite project with React and Typescript.
Create a repository and then excute the following command:

```bash
git submodule add <repository-url> packages/<project-name>
```

you can access with the URL [http://localhost:3000](http://localhost:3000) to the new service.

#### 5.1- Each repository have to have the same BASE package.json configuration:

```json
{
  "name": "@workspaceui/nameOfProject", // This is the name of the package in the workspace
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "serve": "vite preview"
  },
  "dependencies": {
    "react": "^17.0.2",
    "react-dom": "^17.0.2",
    "@workspaceui/projectdependency1": "workspace:^" // This is only required if you have dependencies between packages (ej. MainUI depends on ComponentLibrary)
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^1.0.0",
    "vite": "^2.6.4"
  }
}
```

### 6- Once all your packages are set up, go back to the root of your workspace and run:

```bash
pnpm install
```
