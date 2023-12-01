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

function App() {
  const { isAuthenticated, isSessionLoading } = useSession();
  const { isUserLoading } = useUser();
  const [notes, setNotes] = useState<Note[]>([]);

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
        console.log(notes)
        setNotes(notes);
        console.log(notes)
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
    return <p>Loading...</p>;
  }

  if (!isAuthenticated) {
    return  <div className="max-w-xs rounded-md overflow-hidden m-auto border border-gray-200">
      <Descope
        flowId="sign-up-or-in"
        // theme="light"
        onError={(e) => console.log("Could not log in!" + e)}
      />
    </div>;
  }

  return (
    <div className="text-left">
       <NavBar/>

       <NoteCreation
        setNotes={setNotes}
        notes={notes}
       />

       <NoteCardGrid 
        setNotes={setNotes}
        notes={notes}
       />
    </div>
  );
}

export default App;
