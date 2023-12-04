import { useState, useEffect } from "react";
import "./App.css";
import { Note } from "./types";
import NoteCardGrid from "./components/home/note-card-grid";
import NoteCreation from "./components/home/note-creation";
import NavBar from "./components/layout/navbar";

import {
  useSession,
  useUser,
  getSessionToken,
} from "@descope/react-sdk";
import { Descope } from "@descope/react-sdk";
import ManageGroups from "./components/home/manage-groups.tsx/manage-groups";

function App() {
  const { isAuthenticated, isSessionLoading } = useSession();
  const { isUserLoading } = useUser();
  const [notes, setNotes] = useState<Note[] | null>(null);

  const fetchNotes = async () => {
      try {
        const sessionToken = getSessionToken();
        const response = await fetch("http://localhost:3000/api/notes", {
          headers: {
            Accept: "application/json",
            Authorization: "Bearer " + sessionToken,
          },
        });
        const notes: Note[] = await response.json();
        setNotes(notes);
      } catch (e) {
        console.log(e);
      }
    };

    useEffect(() => {
      if (isAuthenticated) {
        fetchNotes();
      }
    }, [isAuthenticated]);

  
  if (isSessionLoading || isUserLoading) {
    return null;
  }


  return (
    <div className="text-left w-full">
       <NavBar/>

        {!isAuthenticated ? 

        (<div className="max-w-xs rounded-md overflow-hidden m-auto shadow-lg mt-20">
          <Descope
            flowId="sign-up-or-in"
            onError={(e) => console.log("Could not log in!" + e)}
          />
        </div>) : 

        (<>
          <div className="flex flex-row w-full justify-between">
            <NoteCreation
              setNotes={setNotes}
              notes={notes}
            />
            <ManageGroups/>
          </div>

          <NoteCardGrid 
          setNotes={setNotes}
          notes={notes}
          />
        </>)}
       
    </div>
  );
}

export default App;
