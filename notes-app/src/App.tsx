import { useState, useCallback, useEffect } from "react";
import "./App.css";
import { Note } from "./types";
import NoteCardGrid from "../components/home/note-card-grid";
import NoteCreation from "../components/home/note-creation";
import NavBar from "../components/layout/navbar";

import {
  useDescope,
  useSession,
  useUser,
  getSessionToken,
} from "@descope/react-sdk";
import { Descope } from "@descope/react-sdk";

function App() {
  const { isAuthenticated, isSessionLoading } = useSession();
  const { user, isUserLoading } = useUser();
  const { logout } = useDescope();
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

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  if (isSessionLoading || isUserLoading) {
    return <p>Loading...</p>;
  }

  if (!isAuthenticated) {
    return  <Descope
      flowId="sign-up-or-in"
      theme="dark"
      onError={(e) => console.log("Could not log in!" + e)}
    />;
  }

  return (
    <div className="w-full">
       <NavBar/>

       <NoteCreation
        setNotes={setNotes}
        notes={notes}
       />

       <NoteCardGrid 
        setNotes={setNotes}
        notes={notes}
       />
        
      <div className="user">
        <span>
          {user.name} <button onClick={handleLogout}>Logout</button>
        </span>
      </div>
    </div>
  );
}

export default App;
