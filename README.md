# Leaf

This is a monorepo containing the different parts of an app for writing and organizing notes called Leaf.

## Why?

I got the inspo for this from Obsidian. I think Obsidian is pretty amazing. However, I am poor and therefore can't pay for sync at the moment, and I'd really like to be able to edit a note on my PC and still access it on my mobile devices. I also wanted a solution that gave me more control over my data and allowed me to customize the features to my specific needs. Since I'm not such a bad software developer myself, I decided to build something similar, even if its just the basic features.

## Features

- Create, update, organize, and retrieve your notes.
- Organize notes into folders.
- Access your notes from any device with an internet connection.

## Tech Stack

- **Runtime:** Bun
- **Frontend Framework:** TanStack Start
- **Backend Framework:** Hono
- **Database:** Postgres
- **Deployment:** Docker

Other tools used include Drizzle as the ORM layer for the database, Biome for linting and formatting, Husky for Git hooks, and Lintstaged for running linters on staged files.

## Live Demo

- [API Base URL](https://api.leaf.gozman.xyz/api)
- [OpenAPI Docs with Scalar](https://api.leaf.gozman.xyz/api/reference)

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

    - The database can be created using `turbo db:up`. Make sure you have Docker set up on your machine. It can be taken down using `turbo db:down`, and deleted using `turbo db:delete`.

    - Migrate the database using the following commands:

        ```sh
        turbo db:generate
        turbo db:migrate
        ```

4. **Set up the backend app:**

    - Copy `.env.example` to `.env` in the `apps/api` directory.
    - Update the values to set up the environment variables. The required variables include:
        - `PORT`: The port the backend server will listen on (e.g., `8000`).
        - `FRONTEND_URL`: The URL of the frontend application (e.g., `http://localhost:3000`).
        - `DATABASE_URL`: The same DB URL as the one set in the database package.
        - `AUTH_COOKIE`: The name of the auth session cookie.
        - `ENCRYPTION_KEY`: A secret key for encrypting notes. Generate a new secret using the command: `openssl rand -hex 32`.
        - `BETTER_AUTH_SECRET`: A secret key for Better Auth. Generate a new secret using the command: `openssl rand -hex 32`.
        - `BETTER_AUTH_URL`: The URL for Better Auth, typically the backend URL.
        - `RESEND_API_KEY`: Your Resend API key.
        - `RESEND_DOMAIN`: Your Resend domain.
        - `RESEND_API_KEY`: Your Resend API key.
        - `RESEND_DOMAIN`: Your Resend domain.

5. **Set up the frontend app:**

    - Copy `.env.example` to `.env` in the `apps/web` directory.
    - Update the values to set up the environment variables. The required variables include:
        - `API_URL`: The URL of the backend application (e.g., `http://localhost:8000/api`).
        - `DATABASE_URL`: The same DB URL as the one set in the database package.
        - `AUTH_COOKIE`: The name of the auth session cookie.
        - `BETTER_AUTH_SECRET`: A secret key for Better Auth. Generate a new secret using the command: `openssl rand -hex 32`.
        - `BETTER_AUTH_URL`: The URL for Better Auth, typically the frontend URL.
        - `GOOGLE_CLIENT_ID`: Your Google Client ID for Google Auth.
        - `GOOGLE_CLIENT_SECRET`: Your Google Client Secret for Google Auth.

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
