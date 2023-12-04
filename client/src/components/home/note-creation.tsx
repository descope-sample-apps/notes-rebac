import React, { useState } from "react";
import { getSessionToken } from "@descope/react-sdk";
import { Note } from "../../types";
import { Button, Dialog, Flex, Text, TextField } from "@radix-ui/themes";


export default function NoteCreation(props: { notes: Note[] | null, setNotes: (notes: Note[]) => void }) {
    const { notes, setNotes } = props;

    const createNote = async (title: string, content: string) => {
      if (!notes) {
        return;
      }
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
    
      const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setText(event.target.value);
      };
    
      const onSubmitNote = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        if (!title || !text) {
          return;
        }
        await createNote(title, text);
      };
    
    return <div className="my-4">
      <Dialog.Root>
          <Dialog.Trigger>
            <button className="bg-black rounded-md text-white px-4 py-1 hover:bg-gray-700 duration-200">Create Note</button>
          </Dialog.Trigger>
       

        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>Create Note</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Adds a note in the db and relation service.
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