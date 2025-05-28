'use client';
import React, { useState, useEffect } from 'react'

export default function Home() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/flask/users').then(
    response => response.json().then(
      data => setUsers(data)
    )
  )
  },[])

  return (
    <div>
      {
        users.map((user, index) => (
          <div key={index}>
            <span>{user['name']}</span><br/>
            <span>{user['email']}</span>
          </div>
        ))
      }
    </div>
  );
}
