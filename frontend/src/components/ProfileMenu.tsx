import { useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { useDismiss } from "../hooks/useDismiss";
import type { User } from "../types";

export default function ProfileMenu({ user }: { user: User }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useDismiss<HTMLDivElement>(() => setIsOpen(false), isOpen);

  return (
    <div className="profile-menu" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="profile-trigger"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="profile-name">{user.name}</span>
        <span className="avatar">{user.initials}</span>
        <ChevronDown className={isOpen ? "profile-chevron open" : "profile-chevron"} size={17} />
      </button>
      {isOpen && (
        <div className="profile-dropdown" role="menu">
          <div className="profile-dropdown-user">
            <span className="avatar">{user.initials}</span>
            <strong>{user.name}</strong>
          </div>
          <button className="profile-logout" role="menuitem" type="button" onClick={() => setIsOpen(false)}>
            <LogOut size={17} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
