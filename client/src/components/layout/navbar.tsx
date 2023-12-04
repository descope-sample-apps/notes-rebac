"use client";

import { useDescope, useSession, useUser } from "@descope/react-sdk";
import notesLogo from "../../../public/notes.png";
import { useCallback } from "react";
import { Button } from "@radix-ui/themes";

export default function NavBar() {

  const { isSessionLoading, isAuthenticated } = useSession();
  const { isUserLoading } = useUser();
  const { logout } = useDescope();

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

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
              <img className="inline-block" src={notesLogo} width={50}  alt="Notes logo" />
          </a>
          <div>
            {isAuthenticated ? (
            <div>
              <Button variant="soft" onClick={handleLogout}>Logout</Button>
            </div>
            ) : (
              <></>
            )}
          </div>
      </div>
    </>
  );
}
