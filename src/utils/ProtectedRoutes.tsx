import { Outlet, Navigate } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";

export default function ProtectedRoutes() {
    return (
        <>
            <SignedIn>
                <Outlet/>
            </SignedIn>
            <SignedOut>
                <Navigate to={"/login"}/>
            </SignedOut>
        </>
    )
}
