"use client";

import { useSession, useUser } from "@descope/react-sdk";
import notesLogo from "../../../public/notes.png";
import UserDropdown from "../shared/user-dropdown";

export default function NavBar() {

  const { isSessionLoading, isAuthenticated } = useSession();
  const { isUserLoading, user } = useUser();


  if (isSessionLoading || isUserLoading) {
    return <p>...</p>;
  }

  return (
    <>
      <div
        className={`transition-all flex flex-row justify-between w-full mb-10`}
      >
          <a href="/" 
          className="flex items-center flex flex-row font-display text-2xl"
          >
              <img className="inline-block" src={notesLogo} width={40}  alt="Notes logo" /> 
              <h1 className="px-4 text-md font-black">Descope FGA Notes App</h1>
          </a>
          <div>
            {isAuthenticated ? (
            <div>
              <UserDropdown
                name={user?.name || ""}
                email={user?.email || ""}
              />
            </div>
            ) : (
              <></>
            )}
          </div>
      </div>
    </>
  );
}
