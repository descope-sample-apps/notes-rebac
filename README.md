# Descope Notes Demo App

This app uses Descope authentication and FGA (fine-grain authorization - ReBAC) to share notes between users.

- Front-end is written using React Typescript with Vite starting template
- Backend is written in NodeJS with Express and Postgres as the database

### Run locally

- Clone the repo
- Set the following `.env` file in the root directory

```
DATABASE_HOST=<DB-Host> # e.g localhost
DATABASE_PORT=<DB-Port> # e.g 5432
DATABASE_DB=<DB-Name> # e.g postgres
DATABASE_USER=<-DB-User> # e.g postgres
DATABASE_PASSWORD=<DB-Password> #e.g passwordless

DESCOPE_PROJECT_ID=<Your-Project-ID>
DESCOPE_MANAGEMENT_KEY=<Your-Management-Key>
```

- Run `npm install` in the root directory
- Run `npm run dev` in the root directory

You client should be running on `http://localhost:5173/` and the server on `http://localhost:3000`
