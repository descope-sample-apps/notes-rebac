// Helper Typescript types

/**
 * Note holds the note details.
 * No ownership or other ReBAC data is kept in our DB.
 * This way, we can don't have to keep emails and worry about securing them.
 */
export type Note = {
  id: string;
  version: number;
  createDate?: Date;
  modifyDate?: Date;
  title: string;
  content: string;
};

/**
 * Group holds group data and allows sharing with a group instead of a given email.
 * Group ownership is stored in our DB (user IDs are not sensitive) but membership (with emails) is not.
 */
export type Group = {
  id: string;
  version: number;
  createDate?: Date;
  modifyDate?: Date;
  owner: string;
  name: string;
};
