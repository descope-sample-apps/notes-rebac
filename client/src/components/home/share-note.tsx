import React, { useState } from "react";
import { getSessionToken } from "@descope/react-sdk";
import { Note } from "../../types";
import { Button, Dialog, Flex, RadioGroup, Text, TextField } from "@radix-ui/themes";


export default function ShareNote(props: { note: Note }) {
    const { note } = props;

    const shareNote = async (role: string, shareToType: string,  email?: string, group?: string) => {
      try {
        const noteData = shareToType === 'user' ? { role, email } : { role, group };
        console.log(noteData)
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
        if (!response.ok) {
          console.log(response)
        } else {
          alert("Note shared successfully!")
        }
      } catch (e) {
        console.log(e);
      }
    }
    
    const [email, setEmail] = useState<undefined | string>(undefined);
    const [groupId, setGroupId] = useState<undefined | string>(undefined);

    const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(event.target.value);
    };
  
    const handleGroupIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setGroupId(event.target.value);
    };


    const [roleRadio, setRoleRadio] = useState('viewer');

    const onRoleRadioValueChange = (value: string) => {
      setRoleRadio(value);
    };

    const [shareTo, setShareTo] = useState('user');

    const onShareToRadioValueChange = (value: string) => {
      setShareTo(value);
    }

  
    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault(); 
      if (!roleRadio) {
        return;
      }
      if (email && groupId) {
        return;
      }
      await shareNote(roleRadio, shareTo, email, groupId);
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
            Shares the note with a user or group. The creator of the note is the sole 'owner.'
          </Dialog.Description>
          <form onSubmit={onSubmit}>

            <Flex direction="column" gap="3">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Role
                </Text>
                <RadioGroup.Root value={roleRadio} onValueChange={onRoleRadioValueChange}>
                  <Flex gap="2" direction="column">
                    <Text as="label" size="2">
                      <Flex gap="2">
                        <RadioGroup.Item value="viewer" /> Viewer
                      </Flex>
                    </Text>
                    <Text as="label" size="2">
                      <Flex gap="2">
                        <RadioGroup.Item value="editor" /> Editor
                      </Flex>
                    </Text>
                  </Flex>
                </RadioGroup.Root>
              </label>
               <label>
               <Text as="div" size="2" mb="1" weight="bold">
                  Share
                </Text>
                <RadioGroup.Root value={shareTo} onValueChange={onShareToRadioValueChange}>
                  <Flex gap="2" direction="column">
                    <Text as="label" size="2">
                      <Flex gap="2">
                        <RadioGroup.Item value="group" /> Group
                      </Flex>
                    </Text>
                    <Text as="label" size="2">
                      <Flex gap="2">
                        <RadioGroup.Item value="user" /> User
                      </Flex>
                    </Text>
                  </Flex>
                </RadioGroup.Root>
                <div className="mb-2"></div>
              {shareTo === 'group' ? (
                <label>
                  {/* <Text as="div" size="2" mb="1" weight="bold">
                    Group ID
                  </Text> */}
                  <TextField.Input
                    onChange={handleGroupIdChange}
                    placeholder="Enter the Group ID here..."
                  />
                </label>
              ) : (
                <label>
                  {/* <Text as="div" size="2" mb="1" weight="bold">
                    Email
                  </Text> */}
                  <TextField.Input
                    onChange={handleEmailChange}
                    placeholder="Enter email here..."
                  />
                </label>
              )}
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