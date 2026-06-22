import { Link } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";
import type { User } from "../types";

interface AppHeaderProps {
  user: User;
  className?: string;
  onLogout: () => void;
}

export default function AppHeader({ user, className = "", onLogout }: AppHeaderProps) {
  return (
    <header className={`home-topbar ${className}`.trim()}>
      <Link className="siri-lockup logo-home-button" to="/">
        <img className="siri-mark" src="/brand/sydani-group-logo.png" alt="Sydani Group" />
        <strong>SIRI</strong>
        <span>Research Workspace</span>
      </Link>
      <ProfileMenu user={user} onLogout={onLogout} />
    </header>
  );
}
