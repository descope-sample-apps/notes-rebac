// Helper functions to save data in a Postgres DB

import { Pool } from "pg";
import "dotenv/config";
import { Note, Group } from "./types";
import crypto from "crypto";

/**
 * Our connection pool to the database.
 * We expect env variables or .env file
 */
// const pool = new Pool({
//   host: process.env.DATABASE_HOST,
//   port: parseInt(process.env.DATABASE_PORT || "5432"),
//   user: process.env.DATABASE_USER,
//   password: process.env.DATABASE_PASSWORD,
//   database: process.env.DATABASE_DB,
// });

let { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;
const pool = new Pool({
    host: PGHOST,
    user: PGUSER,
    password: PGPASSWORD,
    database: PGDATABASE,
    ssl: {
        rejectUnauthorized: true,
    }
  });

/**
 * initSchema is called once per start to create the DB tables if not already there
 */
export const initSchema = async () => {
  const client = await pool.connect();
  try {
    await client.query(`BEGIN`);
    await client.query(`
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    version INT NOT NULL,
    create_date TIMESTAMP NOT NULL,
    modify_date TIMESTAMP NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL
)`);
    await client.query(`
CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    version INT NOT NULL,
    create_date TIMESTAMP NOT NULL,
    modify_date TIMESTAMP NOT NULL,
    owner TEXT NOT NULL,
    name TEXT NOT NULL,
    CONSTRAINT groups_name_uk UNIQUE (owner, name)
)`);
    await client.query(`COMMIT`);
    console.log("DB schema initialized");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

/**
 * Load a note from the DB by ID. Will throw an error if note does not exist.
 * @param id the note ID to load
 * @returns {Note} the note with the ID
 */
export const loadNote = async (id: string) => {
  const res = await pool.query(
    `
SELECT id, version, create_date as "createDate", modify_date as "modifyDate", title, content
FROM notes
WHERE id = $1`,
    [id],
  );
  if (res.rows.length === 0) {
    throw new Error("Note not found");
  }
  return res.rows[0] as Note;
};

/**
 * Insert a new note into the DB.
 * @param title note title
 * @param content note content
 * @returns {Note} the newly created note with all fields
 */
export const insertNote = async (title: string, content: string) => {
  const res = await pool.query(
    `
INSERT INTO notes
    (id, version, create_date, modify_date, title, content)
VALUES ($1, 1, NOW(), NOW(), $2, $3)
RETURNING id, version, create_date as "createDate", modify_date as "modifyDate"`,
    [crypto.randomUUID(), title, content],
  );
  if (res.rows.length === 0) {
    throw new Error("Error inserting note");
  }
  return { ...res.rows[0], title: title, content: content } as Note;
};

/**
 * Update a note in the DB. We use optimistic locking to prevent lost update problem.
 * @param note the note to update
 * @returns {Note} the updated note
 */
export const updateNote = async (note: Note) => {
  const res = await pool.query(
    `
UPDATE notes
SET version = version + 1, modify_date = NOW(), title = $1, content = $2
WHERE id = $3 and version = $4
RETURNING version, create_date as "createDate", modify_date as "modifyDate"`,
    [note.title, note.content, note.id, note.version],
  );
  if (res.rowCount === 0) {
    throw new Error("Note was updated in another tab");
  }
  return {
    ...res.rows[0],
    id: note.id,
    title: note.title,
    content: note.content,
  } as Note;
};

/**
 * Delete a note in the DB. If note does not exist, ignore and don't raise an error.
 * @param id the id of the note to delete
 */
export const deleteNote = async (id: string) => {
  await pool.query(`DELETE FROM notes WHERE id = $1`, [id]);
};

/**
 * Search for notes user has permissions to access.
 * @param ids a list of note IDs to load
 * @param text search for notes with text either in title or content
 * @returns {Note[]} matching the search
 */
export const searchNotes = async (ids: string[], text?: string) => {
  let q = `
SELECT id, version, create_date as "createDate", modify_date as "modifyDate", title, content
FROM notes
WHERE id = any($1)`;
  const params = [ids];
  if (text) {
    q += ` AND (lower(title) LIKE $2 OR lower(content) LIKE $2)`;
    ids.push(text.toLowerCase());
  }
  const res = await pool.query(q, params);
  return res.rows as Note[];
};

/**
 * Load a group based on either ID or name. Names are unique for user.
 * Throws error if group does not exist.
 * @param owner the user who created the group
 * @param id the optional group id
 * @param name the optional group name
 * @returns {Group} the loaded group
 */
export const loadGroup = async (owner: string, id?: string, name?: string) => {
  if (!id && !name) {
    throw new Error("Must provide either id or name");
  }
  const params = [owner];
  let q = `SELECT id, version, create_date as "createDate", modify_date as "modifyDate", owner, name FROM groups WHERE owner = $1`;
  if (id) {
    q += ` AND id = $2`;
    params.push(id);
  } else {
    q += ` AND name = $2`;
    params.push(name!);
  }
  const res = await pool.query(q, params);
  if (res.rows.length === 0) {
    throw new Error("Group not found");
  }
  return res.rows[0] as Group;
};

/**
 * Create a group for the given owner.
 * @param owner The user who creates the group
 * @param name The name of the group
 * @returns {Group} the newly created group
 */
export const insertGroup = async (owner: string, name: string) => {
  const res = await pool.query(
    `
INSERT INTO groups
    (id, version, create_date, modify_date, owner, name)
VALUES ($1, 1, NOW(), NOW(), $2, $3)
RETURNING id, version, create_date as "createDate", modify_date as "modifyDate"`,
    [crypto.randomUUID(), owner, name],
  );
  if (res.rows.length === 0) {
    throw new Error("Error inserting group");
  }
  return { ...res.rows[0], owner, name } as Group;
};

/**
 * Update the given group.
 * @param group The group to update. Expecting group to have correct id, version and owner.
 * @returns {Group} the newly updated group
 */
export const updateGroup = async (group: Group) => {
  const res = await pool.query(
    `
UPDATE groups
SET version = version + 1, modify_date = NOW(), name = $1
WHERE id = $2 AND version = $3 AND owner = $4
RETURNING version, create_date as "createDate", modify_date as "modifyDate"`,
    [group.name, group.id, group.version, group.owner],
  );
  if (res.rowCount === 0) {
    throw new Error("Group was updated in another tab");
  }
  return {
    ...res.rows[0],
    id: group.id,
    owner: group.owner,
    name: group.name,
  } as Group;
};

/**
 * Delete the given group. If does not exist, just ignores.
 * @param id the group ID to delete
 * @param owner the owner of the group
 */
export const deleteGroup = async (id: string, owner: string) => {
  await pool.query(`DELETE FROM groups WHERE id = $1 AND owner = $2`, [
    id,
    owner,
  ]);
};

/**
 * Load all the groups for the given owner.
 * @param owner the owner to load groups for
 * @returns {Group[]} groups of given owner
 */
export const searchGroups = async (owner: string) => {
  const res = await pool.query(
    `
SELECT id, version, create_date as "createDate", modify_date as "modifyDate", owner, name
FROM groups
WHERE owner = $1`,
    [owner],
  );
  return res.rows as Group[];
};
