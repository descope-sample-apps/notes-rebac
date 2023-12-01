"use client";

import { useSession, useUser } from "@descope/react-sdk";
import notesLogo from "../../public/notes.png";
// import Image from "next/image";
// import useScroll from "@/lib/hooks/use-scroll";
// import { useSignInModal } from "./sign-in-modal";
// import UserDropdown from "./user-dropdown";
// import { Session } from "next-auth";

export default function NavBar() {

  const { isAuthenticated, isSessionLoading } = useSession();
  const { isUserLoading } = useUser();

  if (isSessionLoading || isUserLoading) {
    return <p>...</p>;
  }

  return (
    <>
      <div
        className={`fixed top-0 w-full flex justify-center z-30 transition-all`}
      >
        <div className="mx-5 flex h-16 max-w-screen-xl items-center justify-between w-full">
          <a href="/" className="flex items-center font-display text-2xl">
          <div className="menu">
            <img src={notesLogo} className="logo" height={50} width={100} alt="Notes logo" />
          </div>
          </a>
          <div>
            {isAuthenticated ? (
              <>Dashboard</>
            ) : (
              <a
                className="rounded-full border border-black bg-black p-1.5 px-4 text-sm text-white transition-all hover:bg-white hover:text-black"
                href="/login"
              >
                Sign In
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
