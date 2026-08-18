import ReactDOM from "react-dom/client";
import { StrictMode } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import AuthenticationLayout from "./pages/layouts/AuthenticationLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Techstack from "./pages/Techstack";
import NotFound from "./pages/NotFound";
import Register from "./pages/Signup";
import "./index.css"
import MainLayout from "./pages/layouts/MainLayout";
import ProtectedRoutes from "./utils/ProtectedRoutes";
import ProfilePage from "./pages/Profile";
import SettingsPage from "./pages/Settings";
import GroupPage from "./pages/GroupPage";
import SessionPage from "./pages/SessionPage";
import { LoadingProvider } from "./context/LoadingContext";
import { clerkAppearance } from "./utils/clerkAppearance";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}

const ROUTER = createBrowserRouter([
  {
    element: <AuthenticationLayout/>,
    children: [
      {path:"/login/*", element: <Login/>},
      {path:"/register/*", element: <Register/>}
    ]
  },
  {
    element: <ProtectedRoutes/>,
    children: [
      {
        element: <MainLayout/>,
        children: [
          {path:"/", element: <Home/>},
          {path:"/profile", element:<ProfilePage/>},
          {path:"/settings", element:<SettingsPage/>},
          {path:"/group/:id", element:<GroupPage/>},
          {path:"/group/:id/session/:sessionId", element:<SessionPage/>},
        ]
      }
    ]
  },
  {path:"*", element: <NotFound/>},
  {path:"/tech-stack", element: <Techstack/>},
]);

const ROOT = document.getElementById("root")!;

ReactDOM.createRoot(ROOT).render(
    <StrictMode>
      <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl='/'
      appearance={clerkAppearance}
      >
        <LoadingProvider>
          <RouterProvider router={ROUTER}/>
        </LoadingProvider>
      </ClerkProvider>
    </StrictMode>
  );
