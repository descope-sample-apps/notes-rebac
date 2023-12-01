import { getSessionToken } from "@descope/react-sdk";
import { Note } from "../../src/types";
import ShareNote from "./share-note";


export default function NoteCardGrid(props: { notes: Note[], setNotes: (notes: Note[]) => void }) {
    const { notes, setNotes } = props;

    const deleteNote = async (id: string) => {
        try {
          const sessionToken = getSessionToken();
          await fetch(`http://localhost:3000/api/notes/${id}`, {
            method: "DELETE",
            headers: {
              Accept: "application/json",
              Authorization: "Bearer " + sessionToken,
            },
          });
          setNotes(notes.filter((note) => note.id !== id));
        } catch (e) {
          console.log(e);
        }
    }
    
    return <div className="notes-grid">
        {notes.map((note, i) => (
        <div key={i} className="note-item bg-black">
            <div className="notes-header">
            <button onClick={() => deleteNote(note.id)}>x</button>
            <ShareNote note={note} />
            </div>
            <h2>{note.title}</h2>
            <p>{note.content}</p>
        </div>
    ))}
</div>
}   