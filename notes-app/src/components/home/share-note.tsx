import React, { useState } from "react";
import { getSessionToken } from "@descope/react-sdk";
import { Note } from "../../types";
import { Button, Dialog, Flex, Text, TextField } from "@radix-ui/themes";


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
    
      const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); 

        if (!role) {
          return;
        }
        if (email && groupId) {
          return;
        }
        await shareNote(role, email, groupId);
      };
    
    return <div>
      <Dialog.Root>
        <Dialog.Trigger>
          <button className="underline" onClick={() => {}}>
            Share
          </button>
        </Dialog.Trigger>

        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>Share Note</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Shares the note with a user or group. Please enter either the Group ID or email, but not both.
          </Dialog.Description>
          <form onSubmit={onSubmit}>

            <Flex direction="column" gap="3">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Role*
                </Text>
                <TextField.Input
                  onChange={handleRoleChange}
                  placeholder="Enter role"
                />
              </label>
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Group ID
                </Text>
                <TextField.Input
                  onChange={handleGroupIdChange}
                  placeholder="Enter the Group ID here..."
                />
              </label>
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Email
                </Text>
                <TextField.Input
                  onChange={handleEmailChange}
                  placeholder="Write your email here..."
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