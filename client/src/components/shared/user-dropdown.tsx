"use client";

import { useCallback, useState } from "react";
import { LogOut } from "lucide-react";
import Popover from "./popover";
import { useDescope } from "@descope/react-sdk";

export default function UserDropdown(props: { email: string, name: string}) {
  const { email, name } = props;
  const [openPopover, setOpenPopover] = useState(false);
  const { logout } = useDescope();

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  return (
    <div className="relative inline-block text-left">
      <Popover
        content={
          <div className="w-full rounded-md bg-white p-2 sm:w-56">
            <div className="p-2">
              {name && (
                <p className="truncate text-sm font-medium text-gray-900">
                  {name}
                </p>
              )}
              <p className="truncate text-sm text-gray-500">
                {email}
              </p>
            </div>
            <button
              className="relative flex w-full items-center justify-start space-x-2 rounded-md p-2 text-left text-sm transition-all duration-75 hover:bg-gray-100"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <p className="text-sm">Logout</p>
            </button>
          </div>
        }
        align="end"
        openPopover={openPopover}
        setOpenPopover={setOpenPopover}
      >
        <button
          onClick={() => setOpenPopover(!openPopover)}
          className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-gray-300 transition-all duration-75 focus:outline-none active:scale-95 sm:h-9 sm:w-9"
        >
          <img
            alt={email}
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${name}&backgroundColor=3949ab`}
            width={40}
            height={40}
          />
        </button>
      </Popover>
    </div>
  );
}
