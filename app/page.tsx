import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <section className="py-24">
      <div className="container">
        <h1 className="text-3x1 font-bold">Movie Night Landing Page</h1>
      </div>
      <div className="loginContainer">
        <h1>LOGIN HERE</h1>
      </div>
      <ul>
        <li>
          <Link href={'/register'}>Register</Link>
        </li>
      </ul>
    </section>
  )
}
