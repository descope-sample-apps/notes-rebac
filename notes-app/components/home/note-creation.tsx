import React, { useState } from "react";
import { getSessionToken } from "@descope/react-sdk";
import { Note } from "../../src/types";


export default function NoteCreation(props: { notes: Note[], setNotes: (notes: Note[]) => void }) {
    const { notes, setNotes } = props;

    const createNote = async (title: string, content: string) => {
        try {
          const noteData = { title, content };
          const sessionToken = getSessionToken();
          const response = await fetch("http://localhost:3000/api/notes", {
            method: "POST",
            headers: {
              Accept: "application/json",
              Authorization: "Bearer " + sessionToken,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(noteData),
          });
          const newNote: Note = await response.json();
          setNotes([...notes, newNote]);
    } catch (e) {
          console.log(e);
        }
      }
    
      const [title, setTitle] = useState('');
      const [text, setText] = useState('');
    
      // Change handlers for the input fields
      const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(event.target.value);
      };
    
      const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(event.target.value);
      };
    
      // Modified createNote function
      const onSubmitNote = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); // Prevents the default form submission behavior
        console.log('Title:', title);
        console.log('Text:', text);
        // Add logic here to create the note
        await createNote(title, text);
      };
    
    return <div className="notes-editor">
    <form onSubmit={onSubmitNote}>
      <input type="text" onChange={handleTitleChange} placeholder="Title" />
      <textarea onChange={handleTextChange} placeholder="Write your note here..." />
      <div className="toolbar">
        <button type="submit">Save</button>
      </div>
    </form>
    </div>
}   