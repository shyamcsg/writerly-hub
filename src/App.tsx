
import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Toaster } from "./components/ui/toaster";
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Guidelines from "./pages/Guidelines";
import Events from "./pages/Events";
import Blogs from "./pages/Blogs";
import { ComingSoon } from "./components/shared/ComingSoon";

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/guidelines" element={<Guidelines />} />
          <Route path="/events" element={<Events />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/forums" element={<ComingSoon />} />
          <Route path="/workshops" element={<ComingSoon />} />
          <Route path="/mentorship" element={<ComingSoon />} />
          <Route path="/book-clubs" element={<ComingSoon />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}
