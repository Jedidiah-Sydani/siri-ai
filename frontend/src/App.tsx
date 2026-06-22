import { useCallback, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import LoginPage from "./components/LoginPage";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import HomePage from "./components/home/HomePage";
import WorkspacePage from "./components/workspace/WorkspacePage";
import { clearStoredAuthToken, getStoredAuthToken } from "./services/workspaceApi";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getStoredAuthToken()));
  const handleAuthExpired = useCallback(() => {
    clearStoredAuthToken();
    setIsAuthenticated(false);
  }, []);

  return (
    <ErrorBoundary>
      {isAuthenticated ? (
        <WorkspaceProvider onAuthExpired={handleAuthExpired}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/projects/:paperId" element={<WorkspacePage />} />
            <Route path="/projects/:paperId/:stageId" element={<WorkspacePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </WorkspaceProvider>
      ) : (
        <LoginPage onLogin={() => setIsAuthenticated(true)} />
      )}
    </ErrorBoundary>
  );
}
