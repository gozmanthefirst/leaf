# Notes

This is a Turborepo containing the different parts of an app for writing and organizing notes.

> [!NOTE]
> Even though the backend is mostly complete, the frontend hasn't been built yet. It's coming though, so please have some patience. You can fork the repo and build yours too if you can't wait.

## Why?

I got the inspo for this from Obsidian. I think Obsidian is pretty pretty amazing. However, I am poor and therefore can't pay for sync at the moment, and I'd really like to be able to edit a note on my PC and still access it on my mobile devices. Since I'm not such a bad software developer myself, I decided to build something similar, even if its just the basic features.

## Features

Create, update, organise and retrieve your notes. That's pretty much it. No need to pay for sync either. You're welcome.😉

## Stack

I use Bun in my side projects. It's a really great tool. I advice that you check it out, if you are not using it already. The API was built using Hono. The web app will be built using TanStack Start. The database that was used is PostgreSQL. The app is deployed using Docker.

Other tools used include Drizzle as the ORM layer for the database, Biome (for linting and ...), Husky (for ...), Lintstaged (for ...), and Resend for emails.

## Getting Started

- Install dependencies.

  ```sh
  bun install
  ```

- Set up husky and lintstaged.

  ```sh
  bunx lint-staged
  ```

After running the command, go into .husky/pre-commit and enter `bunx lint-staged`. It'll run any time a commit is being made.

- Set up the database. Create a `.env` file in packages/database and enter the DB URL.
  
  ```env
  DATABASE_URL=postgresql://user:secret@localhost:5432/notes
  ```

  The database can be created using `turbo db:up`. Make sure you have docker set up on your machine. It can be taken down using `turbo db:down`.

  The database can be migrated using the following commands:

  ```sh
  turbo db:generate
  turbo db:migrate
  ```
  
- Set up the backend app. Copy .env.example to .env and update the values to set up the environment variables. The DB URL should be the same as the one set in the database package.

## Running Locally

- Start the dev servers for the various apps and services using:
  
  ```sh
  turbo dev
  ```

  This will also start up the DB.

## Roadmap

These are features that I might add later on. This is not a promise. Don't bank on me adding them.

- [ ] Ability to share notes with other users.
- [ ] Make a PWA.
