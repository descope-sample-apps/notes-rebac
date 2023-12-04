import { Button, Dialog, Flex } from "@radix-ui/themes";
import CreateGroup from "./create-group";
import { useEffect, useState } from "react";
import { Group } from "../../../types";
import { getSessionToken, useSession } from "@descope/react-sdk";
import GroupItem from "./group-item";


export default function ManageGroups() {
    const [groups, setGroups] = useState<Group[]>([]);
    const { isAuthenticated } = useSession();
    const fetchGroups = async () => {
      try {
        const sessionToken = getSessionToken();
        const response = await fetch("http://localhost:3000/api/groups", {
          method: 'GET',
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "Authorization": "Bearer " + sessionToken,
          },
        });
        const groups: Group[] = await response.json();
        console.log(groups)
        setGroups(groups);
      } catch (e) {
        console.log(e);
      }
    };

    useEffect(() => {
      if (isAuthenticated) {
        fetchGroups();
      }
    }, [isAuthenticated]);


    return <div className="my-4">
      <Dialog.Root>
          <Dialog.Trigger>
            <button className="bg-gray-200 rounded-md text-black px-4 py-1 hover:bg-gray-400 duration-200">Manage Groups</button>
          </Dialog.Trigger>
        <Dialog.Content
        style={{ 
            position: 'absolute',
            // top: 0,
            right: 0,
            // bottom: 0,
            left: 0,
            maxWidth: "800px",
            margin: "auto",
            overflowY: 'auto'
            }}>
          <div className="flex flew-row w-full justify-between">
            <Dialog.Title>Manage Groups</Dialog.Title>
            <CreateGroup
                  groups={groups}
                  setGroups={setGroups}
              />
          </div>
          <Dialog.Description size="2" mb="4">
            Create or delete groups that you created. Add or remove members from groups.
          </Dialog.Description>

            <Flex direction="column" gap="3">
            
             <div>
              {/* <h2 className="font-bold">Your Groups</h2> */}
              {groups.length === 0 && <div>No groups</div>}
              {groups.map((group, i) => {
                return <GroupItem
                  key={i}
                  group={group}
                />
              })}
             </div>
            </Flex>

            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </Dialog.Close>
              <Dialog.Close>
                <Button type="submit">Done</Button>
              </Dialog.Close>
            </Flex>

        </Dialog.Content>
      </Dialog.Root>
    </div>
}   
    