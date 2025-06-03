'use client';
import { useActionState } from 'react';
import { createUser } from './createUser'
import Link from 'next/link';
import styles from '../../styles/login/login.module.css'
import button from '../../styles/buttons/buttons.module.css'

const initialState = {
    message: '',
}

export default function RegistrationPage() {
    const [state, formAction, pending] = useActionState(createUser, initialState)

    return (
        <>
            <div className={styles.container}>
                <form action={formAction} className={styles.glassLoginForm}>
                    <h2>Sign Up</h2>
                    <div className={styles.inputGroup}>
                        <label htmlFor="username">Username:</label>
                        <input
                        id="username"
                        name='username'
                        type='text'
                        required/>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Email:</label>
                        <input
                        id="email"
                        name='email'
                        type="email"
                        required/>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="passwrd">Password:</label>
                        <input
                        id="passwrd"
                        name='password'
                        type="password"
                        required
                        minLength={8}/>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="cpasswrd">Confirm Password:</label>
                        <input
                        id="cpasswrd"
                        name='cpassword'
                        type='password'
                        required
                        minLength={8}/>
                    </div>
                    <span>Already have an account? <Link className={styles.link} href={'/'}>Login</Link></span>
                    {!pending && <button className={button.primary} type='submit'>Sign Up</button>}
                    {pending && <button  className={button.primary} disabled>Creating Account...</button>}
                    {state?.message && <p aria-live="polite">{state.message}</p>}
                </form>
            </div>
        </>
    )
}