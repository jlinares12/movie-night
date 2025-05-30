'use client';
import { useState } from 'react';

export default function RegistrationPage() {

    const url = 'http://localhost:8000/api/register';
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPending, setIsPending] = useState(false);

    const createUser = (e: React.FormEvent) => {
        e.preventDefault();

        const user = {username, email, password}

        setIsPending(true);

        fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify(user)
        }).then(() => {
            console.log('user added');
            setIsPending(false);
        })
    }

    return (
        <>
            <form onSubmit={createUser}>
                <span>Sign Up</span>
                <div>
                    <label htmlFor="username">Username:</label>
                    <input
                    id="username"
                    type='text'
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}/>

                    <label htmlFor="email">Email:</label>
                    <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}/>

                    <label htmlFor="passwrd">Password:</label>
                    <input
                    id="passwrd"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}/>

                    <label htmlFor="cpasswrd">Confirm Password:</label>
                    <input id="cpasswrd"/>
                </div>
                {!isPending && <button type='submit'>Sign Up</button>}
                {isPending && <button disabled>Creating Account...</button>}
            </form>
        </>
    )
}