import { getSessionToken } from "@descope/react-sdk";
import { Note } from "../../types";
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
    
    return <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {notes.map((note, i) => (<div key={i}  className="rounded-xl border border-gray-200 bg-white shadow-md h-60 items-center justify-center overflow-scroll">
        
        <div className="py-4 px-4 flex flex-row">
          <button className="underline" onClick={() => deleteNote(note.id)}>Delete</button>
          &nbsp;<ShareNote note={note} />
        </div>

        <div className="pb-6 px-4 text-left">
          <h2 className="font-bold">{note.title}</h2>
          <p className="">{note.content}</p>
        </div>
        

      </div>
    ))}
</div>
}   