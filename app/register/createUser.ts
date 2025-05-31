'use server';
export async function createUser (prevState: {message: ''}, formData: FormData) {
        const url = 'http://localhost:8000/api/register';
        const username = formData.get('username');
        const email = formData.get('email');
        const password = formData.get('password');
        const cpassword = formData.get('cpassword');

        if( password != cpassword ) {
            return { message: 'Passwords must match'}
        }

        const user = {username, email, password}

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify(user)
        })
        const json = await res.json()

        if (!res.ok) {
            return { message: 'Failed to create user'}
        } else {
            return { message: json.message}
        }
    }