# Descope Notes Demo App

This app uses Descope authentication and FGA (fine-grain authorization - ReBAC) to share notes between users.

- Front-end is written using React Typescript with Vite starting template
- Backend is written in NodeJS with Express and Postgres as the database

### Run locally

- Clone the repo

#### Server
- navigate to the server folder
```
cd server
```
- Set the following `.env` file in the server directory
Our backend runs on Postgres, and we recommend connecting with a serverless option like [Neon](https://neon.tech/). You can get the Descope [Project ID](https://app.descope.com/settings/project) and [Management Key](https://app.descope.com/settings/company/managementkeys) from your Descope Dashboard. 
```
PGHOST=<DB-Host> # e.g 'ep-proud-wildflower-78847619-pooler.us-west-2.aws.neon.tech'
PGDATABASE=<DB-name> # e.g 'neondb'
PGUSER=<DB-User> # e.g 'sarah'
PGPASSWORD=<DB-Password> # 'password'

DESCOPE_PROJECT_ID=<Your-Project-ID>
DESCOPE_MANAGEMENT_KEY=<Your-Management-Key>
```
- Run the server
```
npm install
npm start
```

#### Client
- Navigate to the client folder
```
cd client
```
- Set the following `.env` file in the client directory
```
VITE_DESCOPE_PROJECT_ID=<Your-Project-ID>
```
- Run the client
```
npm install
npm run dev
```


You client should be running on `http://localhost:5173` and the server on `http://localhost:3000`
