import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Techstack from "./pages/Techstack";
import "./index.css"

const root = document.getElementById("root")!;

ReactDOM.createRoot(root).render(
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="tech-stack" element={<Techstack />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
