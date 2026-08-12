// src/app/AppRouter.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Public frontend pages
import Home from "../pages/Home";
import Leadership from "../pages/Leadership";
import Header from "../components/Header";
import Footer from "../components/Footer";
import RecognitionPublicPage from "../pages/public/RecognitionPublicPage";
import EventPublicPage from "../pages/public/EventPublicPage";
import LeadershipPublicPage from "../pages/public/LeadershipPublicPage";
import TeamsPage from "../pages/public/TeamsPage";
import DeliverablePublicPage from "../pages/public/DeliverablePublicPage";
import DeliverableAIPublicPage from "../pages/public/AIPublicPage";
import TeamsPublicTablePage from "../pages/public/TeamsPublicTablePage";
import PublicDashboardPage from "../pages/public/DashboardPage";
import Pricing from "../pages/public/Pricing";

// Admin pages
import LoginPage from "../pages/admin/LoginPage";
import AdminDashboardPage from "../pages/admin/DashboardPage";
import ProtectedRoute from "../components/admin/ProtectedRoute";
import UsersPage from "../pages/admin/UsersPage";
import LeadershipPage from "../pages/admin/LeadershipPage";
import EventsPage from "../pages/admin/EventsPage";
import CapabilitiesPage from "../pages/admin/CapabilitiesPage";
import FranchisePage from "../pages/admin/FranchisePage";
import RecognitionPage from "../pages/admin/RecognitionPage";
import DeliverablePage from "../pages/admin/DeliverablePage";
import UploadUsersPage from "../pages/admin/UploadUsersPage";
import ProjectProgramPage from "../pages/public/ProjectProgramPage";
import AddProgram from "../pages/admin/Addprogram";


function AppRouter() {
  return (
    <BrowserRouter>
      {/* Only show frontend Header/Footer for public routes */}
     <Routes>
  {/* Public frontend routes */}
  <Route
    path="/"
    element={<><Header /><Home /><Footer /></>}
  />

  <Route
    path="/leadership"
    element={<><Header /><Leadership /><Footer /></>}
  />


  <Route path="/pricing" element={<Pricing/>} />

  <Route path="/dashboard" element={<PublicDashboardPage />} />

  <Route path="/recognitions" element={<RecognitionPublicPage />} />
  <Route path ="/program" element = {<ProjectProgramPage/>} />
  <Route path="/events" element={<EventPublicPage />} />
  <Route path="/leaderships" element={<LeadershipPublicPage />} />

  {/* ✅ Existing Teams cards page */}
  <Route path="/teams" element={<TeamsPage />} />

  {/* ✅ ADD THIS: Teams table page */}
  <Route
    path="/teams/table"
    element={<TeamsPublicTablePage />}
  />

  <Route path="/deliverables" element={<DeliverablePublicPage />} />
  <Route path="/deliverables/ai" element={<DeliverableAIPublicPage />} />


        {/* Admin routes */}

        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/capabilities" element={<CapabilitiesPage />} />
        <Route path="/admin/franchises" element={<FranchisePage />} />
        <Route path="/admin/users" element={<ProtectedRoute roles={["ADMIN"]}><UsersPage /></ProtectedRoute>} />
        <Route path="/admin/leadership" element={<ProtectedRoute roles={["ADMIN","EDITOR","VIEWER"]}><LeadershipPage /></ProtectedRoute>} />
        <Route path="/admin/events" element={<ProtectedRoute roles={["ADMIN","EDITOR","VIEWER"]}><EventsPage /></ProtectedRoute>} />
        <Route path="/admin/recognition" element={<ProtectedRoute roles={["ADMIN","EDITOR","VIEWER"]}><RecognitionPage /></ProtectedRoute>} />
        <Route path="/admin/deliverables" element={<ProtectedRoute roles={["ADMIN","EDITOR","VIEWER"]}><DeliverablePage /></ProtectedRoute>} />
        <Route path="/admin/upload-users" element={<UploadUsersPage />} />
        <Route path="/add-program" element={<AddProgram />}/>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
