import React, { useState } from "react";
import { getSessionToken } from "@descope/react-sdk";
import { Note } from "../../types";
import { Button, Dialog, Flex, Text, TextField } from "@radix-ui/themes";


export default function EditNote(props: { note: Note, notes: Note[] | null, setNotes: (notes: Note[]) => void }) {
    const { notes, setNotes, note } = props;

    const editNote = async (title: string, content: string) => {
      if (!notes) {
        return;
      }
        try {
          const version = note.version;
          const noteData = { title, content, version };
          const sessionToken = getSessionToken();
          const response = await fetch("http://localhost:3000/api/notes/" + note.id, {
            method: "PUT",
            headers: {
              Accept: "application/json",
              Authorization: "Bearer " + sessionToken,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(noteData),
          });
          if (!response.ok) {
            alert("Error: " + (await response.json()).error)
          } else {
            const newNote: Note = await response.json();
            // Update the note in the notes array
            const index = notes.findIndex((n) => n.id === note.id);
            const newNotes = [...notes];
            newNotes[index] = newNote;
            setNotes(newNotes);
          }
          
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
    
      const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setText(event.target.value);
      };
    
      const onSubmitNote = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        if (!title || !text) {
          return;
        }
        await editNote(title, text);
      };
    
    return <div>
      <Dialog.Root>
          <Dialog.Trigger>
            <button className="underline">Edit</button>
          </Dialog.Trigger>
       

        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>Edit Note</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Updates a note in the db and relation service.
          </Dialog.Description>
          <form onSubmit={onSubmitNote}>

            <Flex direction="column" gap="3">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Title
                </Text>
                <TextField.Input
                  onChange={handleTitleChange}
                  placeholder="Enter title"
                />
              </label>
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Note
                </Text>
                <TextField.Input
                  onChange={handleTextChange}
                  placeholder="Write your note here..."
                />
              </label>
            </Flex>

            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </Dialog.Close>
              <Dialog.Close>
                <Button type="submit">Save</Button>
              </Dialog.Close>
            </Flex>
          </form>

        </Dialog.Content>
      </Dialog.Root>
    </div>
}   