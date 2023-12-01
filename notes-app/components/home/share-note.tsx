import React, { useState } from "react";
import { getSessionToken } from "@descope/react-sdk";
import { Note } from "../../src/types";


export default function ShareNote(props: { note: Note }) {
    const { note } = props;

    const shareNote = async (role: string, email?: string, group?: string) => {
      try {
        const noteData = { email, group, role };
        const sessionToken = getSessionToken();
        const response = await fetch(`http://localhost:3000/api/notes/${note.id}/share`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: "Bearer " + sessionToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(noteData),
        });
        const data = await response.json();
        console.log(data);
      } catch (e) {
        console.log(e);
      }
    }
    
      const [email, setEmail] = useState<undefined | string>(undefined);
      const [groupId, setGroupId] = useState<undefined | string>(undefined);
      const [role, setRole] = useState('');

      // Change handlers for the input fields
      const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(event.target.value);
      };
    
      const handleGroupIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setGroupId(event.target.value);
      };

      const handleRoleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRole(event.target.value);
      };
    
      // Modified createNote function
      const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); // Prevents the default form submission behavior
        // Add logic here to create the note
        await shareNote(role, email, groupId);
      };
    
    return <div className="notes-editor">
    <form onSubmit={onSubmit}>
      <input type="text" onChange={handleEmailChange} placeholder="Email" />
      <input type="text" onChange={handleGroupIdChange} placeholder="Group ID" />
      <input type="text" onChange={handleRoleChange} placeholder="Role" />
      <div className="toolbar">
        <button type="submit">Save</button>
      </div>
    </form>
    </div>
}   