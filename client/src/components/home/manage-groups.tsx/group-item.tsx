import { getSessionToken } from "@descope/react-sdk";
import { useEffect, useState } from "react";
import { Group } from "../../../types";
import AddMember from "./add-member";

export default function GroupItem(props: { group: Group }) {
    const { id, name, owner } = props.group;
    const [members, setMembers] = useState<string[]>([]);
    const fetchMembers = async () => {
        try {
          const sessionToken = getSessionToken();
          const response = await fetch(`http://localhost:3000/api/groups/${id}/members`, {
            method: 'GET',
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "Authorization": "Bearer " + sessionToken,
            },
          });
          const members: string[] = await response.json();
          console.log(members)
          setMembers(members);
        } catch (e) {
          console.log(e);
        }
      
    }

    useEffect(() => {
        fetchMembers();
    }, [id]);
    return <div className="my-4" key={id}>
                <h3 className="font-bold text-xl">{name}</h3>
                <h4>Owner - {owner}</h4>
                <div className="flex flex-row w-full justify-between">
                    <h4 className="my-auto font-medium text-lg">Members</h4>
                    <AddMember
                        group={props.group}
                        members={members}
                        setMembers={setMembers}
                    />
                </div>
                {members.length === 0 && <div>No members</div>}
                {members.map((member) => {
                    return <div key={member}>{member}</div>
                })}
    </div>
}