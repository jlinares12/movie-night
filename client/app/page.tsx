'use client';
import React, { useEffect, useState } from 'react'

export default function home() {
  const [message, setMessage] = useState("Loading");

  useEffect(() => {
    fetch("http://localhost:5000/api/server").then(
      response => response.json().then(
        data => setMessage(data.message)
      )
    )
  },[])

  return (
    <div>{message}</div>
  )
}