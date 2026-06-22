import { useState } from "react";
import type { FormEvent } from "react";
import { ChevronDown, KeyRound, LogOut } from "lucide-react";
import { useDismiss } from "../hooks/useDismiss";
import { changePassword } from "../services/workspaceApi";
import Modal from "./Modal";
import type { User } from "../types";

interface ProfileMenuProps {
  user: User;
  onLogout: () => void;
}

export default function ProfileMenu({ user, onLogout }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const menuRef = useDismiss<HTMLDivElement>(() => setIsOpen(false), isOpen);

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isChangingPassword) return;

    const formData = new FormData(event.currentTarget);
    setPasswordMessage("");
    setPasswordError("");
    setIsChangingPassword(true);

    try {
      await changePassword(
        String(formData.get("oldPassword") || ""),
        String(formData.get("newPassword") || ""),
        String(formData.get("confirmPassword") || ""),
      );
      setPasswordMessage("Password changed.");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Unable to change password.");
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <>
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
            <button
              className="profile-menu-action"
              role="menuitem"
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsPasswordModalOpen(true);
              }}
            >
              <KeyRound size={17} />
              Change password
            </button>
            <button
              className="profile-menu-action profile-menu-action-danger"
              role="menuitem"
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        )}
      </div>
      {isPasswordModalOpen && (
        <Modal
          title="Change password"
          titleId="changePasswordTitle"
          onClose={() => setIsPasswordModalOpen(false)}
        >
          <form onSubmit={handleChangePassword} className="modal-body">
            {passwordMessage && <div className="success-message">{passwordMessage}</div>}
            {passwordError && (
              <div className="source-error" role="alert">
                {passwordError}
              </div>
            )}
            <label>
              Old password
              <input name="oldPassword" type="password" autoComplete="current-password" required disabled={isChangingPassword} />
            </label>
            <label>
              New password
              <input name="newPassword" type="password" autoComplete="new-password" minLength={8} required disabled={isChangingPassword} />
            </label>
            <label>
              Confirm new password
              <input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required disabled={isChangingPassword} />
            </label>
            <div className="stage-actions">
              <button className="primary icon-button" type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? <span className="button-spinner" aria-hidden="true" /> : <KeyRound size={17} />}
                {isChangingPassword ? "Changing..." : "Change password"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
