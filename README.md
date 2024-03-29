# Descope Notes Demo App

This app uses Descope authentication and FGA (fine-grain authorization - ReBAC) to share notes between users.

- Front-end is written using React Typescript with Vite starting template
- Backend is written in NodeJS with Express and Postgres as the database

### Run locally

- Clone the repo

#### Server

1. Navigate to the server folder

```
cd server
```

2. Set the following `.env` file in the server directory
   We recommend connecting with a managed backend service like [Neon](https://neon.tech/). You can get the Descope [Project ID](https://app.descope.com/settings/project) and [Management Key](https://app.descope.com/settings/company/managementkeys) from your Descope Dashboard.

```
PGHOST=<DB-Host> # e.g 'ep-happy-flower-125243-pooler.us-west-2.aws.neon.tech'
PGDATABASE=<DB-name> # e.g 'neondb'
PGUSER=<DB-User> # e.g 'sarah'
PGPASSWORD=<DB-Password> # 'passwordless'

DESCOPE_PROJECT_ID=<Your-Project-ID>
DESCOPE_MANAGEMENT_KEY=<Your-Management-Key>
```

3. Run the server

```
npm install
npm start
```

#### Client

1. Navigate to the client folder

```
cd client
```

2. Set the following `.env` file in the client directory
   Use the same Project ID as used in the server.

```
VITE_DESCOPE_PROJECT_ID=<Your-Project-ID>
```

3. Add `email` to JWT in Descope flow

Navigate to your Descope console, select the flow you'd like to run (the default is `sign-up-or-in`) and add this field to the JWT. This way, the middleware in the backend will be able to access the email directly from the jwt.
<img width="1317" alt="Screenshot 2024-02-08 at 2 08 51 PM" src="https://github.com/descope-sample-apps/notes-rebac/assets/46854522/13bae15e-d50e-4244-b1df-b7a3bf7209f8">


5. Run the client

```
npm install
npm run dev
```

You client should be running on `http://localhost:5173` and the server on `http://localhost:3000`
