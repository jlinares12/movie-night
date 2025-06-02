'use client';
import { useActionState } from "react";
import { login } from './login'
import styles from '../../styles/login/login.module.css'
import Link from "next/link";

const initialState = {
    message: '',
}

export default function LoginForm() {
    const [ state, formAction, pending ] = useActionState(login, initialState)

    return (
        <>
            <div className={styles.container}>
                <form action={formAction} className={styles.glassLoginForm}>
                    <h2>Login</h2>
                    <div className={styles.inputGroup}>
                        <label
                        htmlFor="username">Username:</label>
                        <input
                        id="username"
                        name='username'
                        type='text'
                        required/>
                    </div>

                    <div className={styles.inputGroup}>
                        <label
                        htmlFor="passwrd">Password:</label>
                        <input
                        id="passwrd"
                        name='password'
                        type="password"
                        required
                        minLength={8}/>
                    </div>

                    <span>Don't have an account? <Link className={styles.link} href={'register'}>Sign Up</Link></span>
                    {!pending && <button type='submit' className={styles.button}>Login</button>}
                    {pending && <button disabled className={styles.button}>Creating Account...</button>}
                    {state?.message && <p aria-live="polite">{state.message}</p>}
                </form>
            </div>
        </>
    )
}