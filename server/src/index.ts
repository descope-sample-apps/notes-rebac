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
const descopeClient = DescopeClient({
  projectId: DESCOPE_PROJECT_ID,
  managementKey: DESCOPE_MANAGEMENT_KEY,
});

/**
 * init is called once when starting to initialize the DB and ReBAC schemas
 */
const init = async () => {
  await db.initSchema();
  // Load the existing schema and only update if version is different from what we expect
  const authzSchema = await descopeClient.management.authz.loadSchema();
  if (authzSchema.data?.name !== "1.0") {
    console.log("Creating the ReBAC schema...");
    await descopeClient.management.authz.saveSchema(
      {
        name: "1.0",
        namespaces: [
          // the namespaces (entities) in our schema
          {
            name: "group", // group is used to track group membership and ownership
            relationDefinitions: [
              {
                name: "member",
              },
              {
                name: "owner",
              },
            ],
          },
          {
            name: "note", // note used to track note permissions (owner, editor and viewer)
            relationDefinitions: [
              {
                name: "owner", // the one and only owner of the note
              },
              {
                // Anyone who has access to edit a note
                // Access can be granted directly but of course, owner is also editor
                name: "editor",
                complexDefinition: {
                  nType: "union",
                  children: [
                    {
                      nType: "child",
                      expression: {
                        neType: "self",
                      },
                    },
                    {
                      nType: "child",
                      expression: {
                        neType: "targetSet",
                        targetRelationDefinition: "owner",
                        targetRelationDefinitionNamespace: "note",
                      },
                    },
                  ],
                },
              },
              {
                // Anyone who has access to view a note
                // Access can be granted directly but of course, editor is also viewer
                name: "viewer",
                complexDefinition: {
                  nType: "union",
                  children: [
                    {
                      nType: "child",
                      expression: {
                        neType: "self",
                      },
                    },
                    {
                      nType: "child",
                      expression: {
                        neType: "targetSet",
                        targetRelationDefinition: "editor",
                        targetRelationDefinitionNamespace: "note",
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
      true,
    );
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
    req.authInfo = await descopeClient.validateSession(bearer[1]);
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
  const allRelations = await descopeClient.management.authz.whatCanTargetAccess(
    req.email!,
  );
  // Filter only note viewer relations (permissions)
  const ids = allRelations.data
    ?.filter(
      (relation) =>
        relation.namespace === "note" &&
        relation.relationDefinition === "viewer",
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
    console.log(note)
    // Make sure to create the note owner permission in Descope ReBAC
    await descopeClient.management.authz.createRelations([
      {
        resource: note.id,
        relationDefinition: "owner",
        namespace: "note",
        target: req.email,
      },
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
    // First, check if user is an editor of the note
    const authorized = await descopeClient.management.authz.hasRelations([
      {
        resource: req.params.id,
        relationDefinition: "editor",
        namespace: "note",
        target: req.email!,
      },
    ]);
    if (authorized.data && authorized.data[0].hasRelation) {
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
    const authorized = await descopeClient.management.authz.hasRelations([
      {
        resource: req.params.id,
        relationDefinition: "owner",
        namespace: "note",
        target: req.email!,
      },
    ]);
    if (authorized.data && authorized.data[0].hasRelation) {
      // If so, delete it in the DB and in Descope ReBAC
      await db.deleteNote(req.params.id);
      await descopeClient.management.authz.deleteRelationsForResources([
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
    const authorized = await descopeClient.management.authz.hasRelations([
      {
        resource: req.params.id,
        relationDefinition: "owner",
        namespace: "note",
        target: req.email!,
      },
    ]);
    if (authorized.data && authorized.data[0].hasRelation) {
      if (email) {
        // Create the relation for the target email
        await descopeClient.management.authz.createRelations([
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
        await descopeClient.management.authz.createRelations([
          {
            resource: req.params.id,
            relationDefinition: role,
            namespace: "note",
            targetSetResource: g.id,
            targetSetRelationDefinition: "member",
            targetSetRelationDefinitionNamespace: "group",
          },
        ]);
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
    await descopeClient.management.authz.deleteRelationsForResources([
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
    const exists = await descopeClient.management.authz.hasRelations([
      {
        resource: group.id,
        relationDefinition: "member",
        namespace: "group",
        target: req.email!,
      },
    ]);
    if (!exists.data || !exists.data[0].hasRelation) {
      // If not, create the membership relation between given email and group
      // Emails are never stored in our DB, only in Descope
      await descopeClient.management.authz.createRelations([
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
    const exists = await descopeClient.management.authz.hasRelations([
      {
        resource: group.id,
        relationDefinition: "member",
        namespace: "group",
        target: req.email!,
      },
    ]);
    if (exists.data && exists.data[0].hasRelation) {
      // If exists, remove the membership relation between given email and group
      await descopeClient.management.authz.deleteRelations([
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
  const members = await descopeClient.management.authz.whoCanAccess(
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
