import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Copilot from "./pages/Copilot.jsx";
import Insight from "./pages/Insight.jsx";
import Navbar from "./components/nav.jsx";

import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-root">
        <Navbar />

        <div className="main-canvas">
          <div className="page">
            <Routes>
              <Route path="/" element={<Navigate to="/copilot" replace />} />
              <Route path="/copilot" element={<Copilot />} />
              <Route path="/insight" element={<Insight />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}
