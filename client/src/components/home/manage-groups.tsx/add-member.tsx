import { getSessionToken } from "@descope/react-sdk";
import { useState } from "react";
import { Group } from "../../../types";
import { Button, Dialog, Flex, Text, TextField } from "@radix-ui/themes";

export default function AddMember(props: { group: Group, members: string[], setMembers: (members: string[]) => void }) {
    const { id } = props.group;
    const addMember = async (email: string) => {
      console.log("Add member")
        try {
          const sessionToken = getSessionToken();
          const res = await fetch(`http://localhost:3000/api/groups/${id}/add`, {
            method: 'POST',
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "Authorization": "Bearer " + sessionToken,
            },
            body: JSON.stringify({ email }),
          });
          if (res.ok) {
            props.setMembers([...props.members, email]);
          }
        } catch (e) {
          console.log(e);
        }
      
    }

    const [email, setEmail] = useState('');
    
    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(event.target.value);
    };
  
    const onSubmitGroup = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      
      if (!email) {
        return;
      }
      await addMember(email);
    };
    
    return <div className="my-4">
    <Dialog.Root>
        <Dialog.Trigger>
          <button className="bg-black rounded-md text-white px-4 py-1 hover:bg-gray-700 duration-200">Add Member</button>
        </Dialog.Trigger>
     

      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>Add Member</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Adds a member to a group in the db and relation service.
        </Dialog.Description>
        <form onSubmit={onSubmitGroup}>

          <Flex direction="column" gap="3">
            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Email
              </Text>
              <TextField.Input
                onChange={handleNameChange}
                placeholder="Enter user email"
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
              <Button type="submit">Add</Button>
            </Dialog.Close>
          </Flex>
        </form>

      </Dialog.Content>
    </Dialog.Root>
  </div>
}