    // src/AppRouter.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Leadership from "./pages/Leadership";
import Events from "./pages/Events";



function AppRouter() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} /> 
        <Route path="/leadership" element={<Leadership />} />
        <Route path="/events" element={<Events />} />
      </Routes>
       <Footer />
    </Router>
  );
}

export default AppRouter;
