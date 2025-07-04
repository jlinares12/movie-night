import { SignUp } from "@clerk/clerk-react";

export default function Register() {
    return (
        <>
            <SignUp signInUrl="/login"/>
        </>
    )
}