// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./components/auth/LoginPage";
import RegisterPage from "./components/auth/RegisterPage";
import HomePage from "./components/home/HomePage";
import PlayCustom from "./components/home/game/PlayCustom";
import PlayToday from "./components/home/game/PlayToday";
import Leaderboard from "./components/home/Leaderboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/play/custom" element={<PlayCustom />} />  {/* <-- add */}
        <Route path="/play/today" element={<PlayToday />} />
        <Route path="/leaderboard" element={<Leaderboard />} />   {/* <-- ADD THIS */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

