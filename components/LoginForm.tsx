'use client';
import { useActionState } from "react";
import { login } from './login'

const initialState = {
    message: '',
}

export default function LoginForm() {
    const [ state, formAction, pending ] = useActionState(login, initialState)

    return (
        <>
        <form action={formAction}>
                <span>Sign Up</span>
                <div>
                    <label htmlFor="username">Username:</label>
                    <input
                    id="username"
                    name='username'
                    type='text'
                    required/>

                    <label htmlFor="passwrd">Password:</label>
                    <input
                    id="passwrd"
                    name='password'
                    type="password"
                    required
                    minLength={8}/>
                </div>
                {!pending && <button type='submit'>Login</button>}
                {pending && <button disabled>Creating Account...</button>}
                {state?.message && <p aria-live="polite">{state.message}</p>}
            </form>
        </>
    )
}