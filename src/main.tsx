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
  {path:"*", element: <NotFound/>},
  {path:"/", element: <Home/>},
  {path:"/tech-stack", element: <Techstack/>},
]);

const ROOT = document.getElementById("root")!;

ReactDOM.createRoot(ROOT).render(
    <StrictMode>
      <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl='/'
      appearance={{
        variables: {
          colorBackground: '#0C1A0D',       // Dark green background
          colorText: 'white',               // White text
          colorPrimary: '#40D952',          // Bright green primary color
          colorInputBackground: '#1A2E1B',  // Slightly lighter input background
          colorInputText: 'white',          // Input text color           // Rounded corners
          fontFamily: 'Inter, sans-serif',  // Modern font
          fontSize: '16px',
        },
        elements: {
          socialButtonsBlockButton__google: {
          color: 'white',
          borderColor: '#40D952'
          },
          rootBox: {
            border: '1px solid #40D952',
            borderRadius: '10px'
          }
        }
      }}
      >
        <RouterProvider router={ROUTER}/>
      </ClerkProvider>
    </StrictMode>
  );
