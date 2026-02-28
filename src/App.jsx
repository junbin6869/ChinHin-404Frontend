import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Copilot from "./pages/Copilot.jsx";
import Insight from "./pages/Insight.jsx";
import Login from "./pages/Login.jsx";
import Navbar from "./components/nav.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

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

              {/* public */}
              <Route path="/login" element={<Login />} />

              {/* protected */}
              <Route
                path="/copilot"
                element={
                  <ProtectedRoute>
                    <Copilot />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/insight"
                element={
                  <ProtectedRoute>
                    <Insight />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}