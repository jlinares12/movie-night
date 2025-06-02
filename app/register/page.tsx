'use client';
import { useActionState } from 'react';
import { createUser } from './createUser'

const initialState = {
    message: '',
}

export default function RegistrationPage() {
    const [state, formAction, pending] = useActionState(createUser, initialState)

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

                    <label htmlFor="email">Email:</label>
                    <input
                    id="email"
                    name='email'
                    type="email"
                    required/>

                    <label htmlFor="passwrd">Password:</label>
                    <input
                    id="passwrd"
                    name='password'
                    type="password"
                    required
                    minLength={8}/>

                    <label htmlFor="cpasswrd">Confirm Password:</label>
                    <input
                    id="cpasswrd"
                    name='cpassword'
                    type='password'
                    required
                    minLength={8}/>
                </div>
                {!pending && <button type='submit'>Sign Up</button>}
                {pending && <button disabled>Creating Account...</button>}
                {state?.message && <p aria-live="polite">{state.message}</p>}
            </form>
        </>
    )
}