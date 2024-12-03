// Our main app uses Express with Descope to manage notes

import "dotenv/config";
import * as db from "./queries";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import DescopeClient, { AuthenticationInfo } from "@descope/node-sdk";

// Descope project details
const DESCOPE_PROJECT_ID = process.env.DESCOPE_PROJECT_ID as string;
const DESCOPE_MANAGEMENT_KEY = process.env.DESCOPE_MANAGEMENT_KEY as string;

// The Descope client used throughout the code
const descope = DescopeClient({
  projectId: DESCOPE_PROJECT_ID,
  managementKey: DESCOPE_MANAGEMENT_KEY,
});

/**
 * init is called once when starting to initialize the DB and ReBAC schemas
 */
const init = async () => {
  await db.initSchema();
  // Load the existing schema and only update if version is different from what we expect
  const authzSchema = await descope.management.authz.loadSchema();
  if (authzSchema.data?.name !== "1.0") {

    console.log("Creating the ReBAC schema...");

    const schema = {
      dsl: `
        model AuthZ 1.0
        type user

        type group
          relation member: user
          relation owner: user

        type note
          relation owner: user | group#member | group#owner | group
          relation editor: group | group#member | group#owner | user
          relation viewer: group | group#member | group#owner | user

          permission can_edit: editor | owner
          permission can_view: viewer | can_edit
      `
    }
    await descope.management.fga.saveSchema(schema)

    console.log("ReBAC schema created.");
  }
};

init();

// Add authInfo and email to requests via middleware
declare module "express-serve-static-core" {
  interface Request {
    authInfo?: AuthenticationInfo;
    email?: string;
  }
}

/**
 * Only authenticated users should be able to access the API.
 * We expect an authorization bearer header with Descope JWT
 * @param req
 * @param res
 * @param next
 */
const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const auth = req.headers?.authorization;
    if (!auth) {
      throw new Error("Missing authorization header");
    }
    const bearer = auth.split(" ");
    if (bearer.length !== 2) {
      throw new Error("Invalid authorization header");
    }
    req.authInfo = await descope.validateSession(bearer[1]);
    req.email = <string>req.authInfo.token["email"];
    if (!req.email) {
      throw new Error("Invalid session JWT");
    }
    next();
  } catch (e) {
    console.log(e);
    res.status(401).json({ error: "Unauthorized!" });
  }
};

// Our web application
const app = express();

app.use(express.json());
app.use(cors());
// Use the Descope middleware
app.use(authMiddleware);

// Handle retrieving of the notes
app.get("/api/notes", async (req, res) => {
  // First, make sure to identify all the notes we have access to (viewer permission)
  // This is done for us by Descope ReBAC
  const allRelations = await descope.management.authz.whatCanTargetAccess(
    req.email!,
  );

  // Filter only notes with can_view permissions
  const ids = allRelations.data
    ?.filter(
      (relation) =>
        relation.namespace === "note" &&
        relation.relationDefinition === "can_view"
    )
    .map((relation) => relation.resource);
  // Now we can load the notes from the database
  // Allow for text search in title and content
  const notes = await db.searchNotes(ids || [], <string>req.query.text);
  res.json(notes);
});

// Create a new note by posting to the API
app.post("/api/notes", async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "title and content fields required" });
  }
  try {
    const note = await db.insertNote(title, content);
    // Make sure to create the note owner permission in Descope ReBAC
    await descope.management.fga.createRelations([
      {
        resource: note.id,
        resourceType: "note",
        relation: "owner",
        target: req.email!,
        targetType: "user",
      }
    ]);
    res.json(note);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Oops, something went wrong" });
  }
});

// Update an existing note (using optimistic locking)
app.put("/api/notes/:id", async (req, res) => {
  const { title, content, version } = req.body;
  if (!title || !content || !version) {
    return res
      .status(400)
      .json({ error: "title, content and version fields required" });
  }

  try {
    // First, check if user has can_edit permission on the note
    const authorized = await descope.management.fga.check([
      {
        resource: req.params.id,
        resourceType: "note",
        relation: "can_edit",
        targetType: "user",
        target: req.email!,
      }
    ])
    console.log(authorized.data)
    if (authorized.data && authorized.data[0].allowed) {
      // If so, update in the DB
      const note = await db.updateNote({
        id: req.params.id,
        version: version,
        title: title,
        content: content,
      });
      res.json(note);
    } else {
      // If not, return 403
      return res
        .status(403)
        .json({ error: "You are not an editor of this note" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Oops, something went wrong" });
  }
});

// Delete the note with given id
app.delete("/api/notes/:id", async (req, res) => {
  try {
    // First, check if user is the owner of the note
    const authorized = await descope.management.fga.check([
      {
        resource: req.params.id,
        resourceType: "note",
        relation: "owner",
        targetType: "user",
        target: req.email!,
      }
    ])

    if (authorized.data && authorized.data[0].allowed) {
      // If so, delete it in the DB and in Descope ReBAC
      await db.deleteNote(req.params.id);
      await descope.management.authz.deleteRelationsForResources([
        req.params.id,
      ]);
      res.status(204).send();
    } else {
      // If not, return 403
      return res
        .status(403)
        .json({ error: "You are not the owner of this note" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Oops, something went wrong" });
  }
});

// Share a note with another email or group of emails
app.post("/api/notes/:id/share", async (req, res) => {
  const { email, group, role } = req.body;
  if (!email && !group) {
    return res
      .status(400)
      .json({ error: "either email or group id is required to share note" });
  }
  if (!role) {
    return res.status(400).json({ error: "role is required" });
  }
  if (role !== "editor" && role !== "viewer") {
    return res.status(400).json({ error: "role must be 'editor' or 'viewer'" });
  }

  try {
    // Only owners can share with others
    const authorized = await descope.management.fga.check([
      {
        resource: req.params.id,
        resourceType: "note",
        relation: "owner",
        targetType: "user",
        target: req.email!,
      }
    ])
    if (authorized.data && authorized.data[0].allowed) {
      if (email) {
        // Create the relation for the target email
        await descope.management.authz.createRelations([
          {
            resource: req.params.id,
            relationDefinition: role,
            namespace: "note",
            target: email,
          },
        ]);
      } else {
        // Make sure that the user is also the owner of the group
        const g = await db.loadGroup(req.authInfo?.token.sub!, group);
        // Create the relation between note and group via targetSet
        // Basically, anyone who is member of the group will have access to the note
        await descope.management.fga.createRelations([
          {
            resource: req.params.id,
            resourceType: "note",
            relation: role,
            targetType: "group",
            target: g.id,
          }
        ])
      }
      res.status(204).send();
    } else {
      return res
        .status(403)
        .json({ error: "You are not the owner of this note" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Oops, something went wrong" });
  }
});

// List the existing groups the user created
app.get("/api/groups", async (req, res) => {
  res.json(await db.searchGroups(req.authInfo?.token.sub!));
});

// Create a new group for the user
app.post("/api/groups", async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "name required" });
  }
  try {
    const group = await db.insertGroup(req.authInfo?.token.sub!, name);
    res.json(group);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Oops, something went wrong" });
  }
});

// Update the group name
app.put("/api/groups/:id", async (req, res) => {
  const { name, version } = req.body;
  if (!name || !version) {
    return res.status(400).json({ error: "name and version fields required" });
  }

  try {
    const group = await db.updateGroup({
      id: req.params.id,
      version,
      owner: req.authInfo?.token.sub!,
      name,
    });
    res.json(group);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Oops, something went wrong" });
  }
});

// Delete the group with the given id
app.delete("/api/groups/:id", async (req, res) => {
  try {
    // Make sure the group exists and the user is the owner
    const group = await db.loadGroup(req.authInfo?.token.sub!, req.params.id);
    // Delete in the DB
    await db.deleteGroup(group.id, group.owner);
    // Delete the relations for the group
    await descope.management.authz.deleteRelationsForResources([
      group.id,
    ]);
    res.status(204).send();
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Oops, something went wrong" });
  }
});

// Add a member to the group
app.post("/api/groups/:id/add", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "email is required to add to group" });
  }
  try {
    // Make sure that the group exists and the user is the owner
    const group = await db.loadGroup(req.authInfo?.token.sub!, req.params.id);
    // Check if the relation already exists
    const exists = await descope.management.fga.check([
      {
        resource: group.id,
        resourceType: "group",
        relation: "member",
        targetType: "user",
        target: req.email!,
      }
    ])
    if (!exists.data || !exists.data[0].allowed) {
      // If not, create the membership relation between given email and group
      // Emails are never stored in our DB, only in Descope
      await descope.management.authz.createRelations([
        {
          resource: group.id,
          relationDefinition: "member",
          namespace: "group",
          target: email,
        },
      ]);
    }
    res.status(204).send();
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Oops, something went wrong" });
  }
});

// Remove a member from a group
app.post("/api/groups/:id/remove", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res
      .status(400)
      .json({ error: "email is required to remove from group" });
  }
  try {
    // Make sure that the group exists and the user is the owner
    const group = await db.loadGroup(req.authInfo?.token.sub!, req.params.id);
    // Check if the relation already exists
    const exists = await descope.management.fga.check([
      {
        resource: group.id,
        resourceType: "group",
        relation: "member",
        targetType: "user",
        target: email,
      }
    ])
    if (exists.data && exists.data[0].allowed) {
      // If exists, remove the membership relation between given email and group
      await descope.management.authz.deleteRelations([
        {
          resource: group.id,
          relationDefinition: "member",
          namespace: "group",
          target: email,
        },
      ]);
    }
    res.status(204).send();
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Oops, something went wrong" });
  }
});

// List the members of the given group
app.get("/api/groups/:id/members", async (req, res) => {
  // Make sure the group exists and the user is the owner
  const group = await db.loadGroup(req.authInfo?.token.sub!, req.params.id);
  // Retrieve the targets of the "member" relation definition for this group
  const members = await descope.management.authz.whoCanAccess(
    group.id,
    "member",
    "group",
  );
  res.json(members.data);
});

const PORT = parseInt((process.env.PORT as string) || "3000");

app.listen(PORT, () => {
  console.log(`server running on localhost:${PORT}`);
});
