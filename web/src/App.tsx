import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CandidatePage from "./pages/CandidatePage";
import ReviewerPage from "./pages/ReviewerPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/candidate/:sessionId" element={<CandidatePage />} />
      <Route path="/reviewer/:sessionId" element={<ReviewerPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
