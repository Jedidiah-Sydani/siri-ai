import { Navigate, Route, Routes } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import HomePage from "./components/home/HomePage";
import WorkspacePage from "./components/workspace/WorkspacePage";

export default function App() {
  return (
    <ErrorBoundary>
      <WorkspaceProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/projects/:paperId" element={<WorkspacePage />} />
          <Route path="/projects/:paperId/:stageId" element={<WorkspacePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </WorkspaceProvider>
    </ErrorBoundary>
  );
}
