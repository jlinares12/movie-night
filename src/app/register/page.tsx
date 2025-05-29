'use client';
import { useState } from 'react';

export default function RegistrationPage() {
    const url = 'localhost:8000/api/register';
    const [newUser, setNewUser] = useState({username: '', email: '', password: '' })
    function createUser() {
        console.log("user")
    }

    return (
        <>
            <form onSubmit={createUser}>
                <span>Sign Up</span>
                <div>
                    <label htmlFor="username">Username:</label>
                    <input id="username" placeholder=""></input>
                    <label htmlFor="email">Email:</label>
                    <input id="email" type="email"></input>
                    <label htmlFor="passwrd">Password:</label>
                    <input id="passwrd"></input>
                    <label htmlFor="cpasswrd">Confirm Password:</label>
                    <input id="cpasswrd"></input>
                </div>
                <input type="submit"></input>
            </form>
        </>
    )
}