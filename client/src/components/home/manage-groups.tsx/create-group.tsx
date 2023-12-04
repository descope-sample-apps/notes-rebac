import React, { useState } from "react";
import { getSessionToken } from "@descope/react-sdk";
import { Button, Dialog, Flex, Text, TextField } from "@radix-ui/themes";
import { Group } from "../../../types";


export default function CreateGroup(props: { groups: Group[], setGroups: (groups: Group[]) => void }) {
    const { groups, setGroups } = props;
    const createGroup = async (name: string) => {
        try {
          const noteData = { name };
          const sessionToken = getSessionToken();
          const response = await fetch("http://localhost:3000/api/groups", {
            method: "POST",
            headers: {
              Accept: "application/json",
              Authorization: "Bearer " + sessionToken,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(noteData),
          });
          const newGroup: Group = await response.json();
          setGroups([...groups, newGroup]);
        } catch (e) {
          console.log(e);
        }
      }
    
      const [name, setName] = useState('');
    
      // Change handlers for the input fields
      const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
      };
    
    
      const onSubmitGroup = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        if (!name) {
          return;
        }
        await createGroup(name);
      };
    
    return <div className="my-4">
      <Dialog.Root>
          <Dialog.Trigger>
            <button className="bg-black rounded-md text-white px-4 py-1 hover:bg-gray-700 duration-200">Create Group</button>
          </Dialog.Trigger>
       

        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>Create Group</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Adds a group in the db and relation service.
          </Dialog.Description>
          <form onSubmit={onSubmitGroup}>

            <Flex direction="column" gap="3">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Name
                </Text>
                <TextField.Input
                  onChange={handleNameChange}
                  placeholder="Enter group name"
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