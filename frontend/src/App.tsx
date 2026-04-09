import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { MapContainer } from "./components/MapContainer";
import { NextDestination } from "./components/NextDestination";
import { NotesSection } from "./components/NotesSection";
import { AboutSection } from "./components/AboutSection";
import { AdminPage } from "./components/AdminPage";
import { LoginPage } from "./components/LoginPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

export default function App() {
  return (
    <Router>
      <div className="relative min-h-screen bg-neutral-950 font-sans selection:bg-blue-500/30">
        <Navbar />

        <Routes>
          <Route path="/" element={
            <main className="relative w-full h-screen overflow-hidden">
              <MapContainer />
              <NextDestination />
            </main>
          } />

          <Route path="/notes" element={<NotesSection />} />
          <Route path="/about" element={<AboutSection />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}
