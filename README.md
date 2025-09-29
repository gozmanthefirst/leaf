# Leaf

This is a monorepo containing the different parts of an app for writing and organizing notes called Leaf.

> [!NOTE]
> Even though the backend is mostly complete, the frontend hasn't been built yet. It's coming though, so please have some patience.

- [Leaf](#leaf)
  - [Why?](#why)
  - [Features](#features)
  - [Stack](#stack)
  - [Prerequisites](#prerequisites)
  - [Getting Started](#getting-started)
  - [Running Locally](#running-locally)
  - [Contributing](#contributing)
  - [Roadmap](#roadmap)

## Why?

I got the inspo for this from Obsidian. I think Obsidian is pretty amazing. However, I am poor and therefore can't pay for sync at the moment, and I'd really like to be able to edit a note on my PC and still access it on my mobile devices. I also wanted a solution that gave me more control over my data and allowed me to customize the features to my specific needs. Since I'm not such a bad software developer myself, I decided to build something similar, even if its just the basic features.

## Features

- Create, update, organize, and retrieve your notes.
- Organize notes into folders.
- Favorite notes for quick access.
- Tag notes for easy searching and filtering.
- Access your notes from any device with an internet connection.

## Stack

I use bun in my projects. The API was built using Hono. The web app will be built using TanStack Start. The database that was used is PostgreSQL. The app is deployed using Cloudflare Workers.

Other tools used include Prisma as the ORM layer for the database, Biome for linting and formatting, Husky for Git hooks, Lintstaged for running linters on staged files, and Resend for emails.

## Prerequisites

- [Bun](https://bun.sh/)
- [Docker](https://www.docker.com/)

## Getting Started

1. **Install dependencies:**

    ```sh
    bun install
    ```

2. **Set up Husky and Lintstaged:**

    ```sh
    bunx husky init
    ```

    After running the command, go into `.husky/pre-commit` and enter `bunx lint-staged`. It'll run any time a commit is being made.

3. **Set up the database:**

    - Create a `.env` file in `packages/db` and enter the DB URL:

        ```env
        DATABASE_URL=postgresql://user:secret@localhost:5432/leaf
        ```

    - The database can be created using `turbo db:up`. Make sure you have Docker set up on your machine. It can be taken down using `turbo db:down`.

    - The database can be migrated using the following commands:

        ```sh
        turbo db:generate
        turbo db:migrate
        ```

4. **Set up the backend app:**

    - Copy `.env.example` to `.env` in the `apps/api` directory.
    - Update the values to set up the environment variables. The required variables include:
        - `NODE_ENV`: The environment the app is running in (e.g., `development`, `production`).
        - `PORT`: The port the backend server will listen on (e.g., `8000`).
        - `FRONTEND_URL`: The URL of the frontend application (e.g., `http://localhost:3000`).
        - `DATABASE_URL`: The same DB URL as the one set in the database package.
        - `BETTER_AUTH_SECRET`: A secret key for Better Auth. Generate a new secret using the command: `openssl rand -hex 32`.
        - `BETTER_AUTH_URL`: The URL for Better Auth, typically the backend URL.
        - `RESEND_API_KEY`: Your Resend API key.
        - `RESEND_DOMAIN`: Your Resend domain.

## Running Locally

- Start the dev servers for the various apps and services using:

    ```sh
    turbo dev
    ```

    This will also start up the DB.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them with clear, concise messages.
4. Submit a pull request.

## Roadmap

These are features that I might add later on. This is not a promise. Don't bank on me adding them

- [ ] Ability to share notes with other users.
- [ ] Make a PWA.
