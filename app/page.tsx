'use client';
import styles from "./styles/page.module.css";
import LoginForm from "../components/LoginForm";
import Link from "next/link";

export default function LandingPage() {
  return (
    <>
      <div className={styles.page}>
        Landing Page
        <span><Link href={'register'}>Sign Up</Link></span>
        <LoginForm></LoginForm>
      </div>
    </>
  )
}
