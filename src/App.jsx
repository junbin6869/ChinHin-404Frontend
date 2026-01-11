import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/nav.jsx";


function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <main className="page">
        <Routes>
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
