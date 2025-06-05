'use server';

import { permanentRedirect } from 'next/navigation'

export async function login (prevState: {message: ''}, formData: FormData) {
    const url = 'http://localhost:8000/api/login'
    const username = formData.get('username')
    const password = formData.get('password')

    const credentials = {username, password}

    const result = await fetch(url, {
        method: 'POST',
        headers: { "Content-Type" : "application/json"},
        body: JSON.stringify(credentials)
    })

    const json = await result.json()

    if (!result.ok) {
            return { message: json.error }
        } else {
            permanentRedirect('/home')
        }
}