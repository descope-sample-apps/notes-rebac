import { useState, useCallback, useEffect } from "react";
import "./App.css";
import notesLogo from "/notes.png";
import { Note } from "./types";

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
      setNotes(notes);
    } catch (e) {
      console.log(e);
    }
  };

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  return (
    <>
      {!isAuthenticated && (
        <Descope
          flowId="sign-up-or-in"
          theme="dark"
          onSuccess={() => fetchNotes()}
          onError={(e) => console.log("Could not log in!" + e)}
        />
      )}

      {(isSessionLoading || isUserLoading) && <p>Loading...</p>}

      {!isUserLoading && isAuthenticated && (
        <>
          <div className="app-container">
            <div className="menu">
              <img src={notesLogo} className="logo" alt="Notes logo" />
            </div>
            <div className="notes-grid">
              {notes.map((note) => (
                <div className="note-item">
                  <div className="notes-header">
                    <button>x</button>
                  </div>
                  <h2>{note.title}</h2>
                  <p>{note.content}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="user">
            <span>
              {user.name} <button onClick={handleLogout}>Logout</button>
            </span>
          </div>
        </>
      )}
    </>
  );
}

export default App;
