import React from "react";
import Link from "next/link";

export default function LoginForm() {
    return (
        <form>
            <span>Login</span>
            <div>
                <label htmlFor="username">Username</label>
                <input id="username"></input>
                <label htmlFor="password">Password</label>
                <input id="password"></input>
            </div>
            <p>Don't have an account?</p><Link href={'/register'}>sign up</Link>
        </form>
    )
}