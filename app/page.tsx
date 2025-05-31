'use client';
import styles from "./styles/page.module.css";
import Link from "next/link";

export default function LandingPage() {
  return (
    <>
      <div className={styles.page}>
        Landing Page
        <span><Link href={'register'}>Sign Up</Link></span>
      </div>
    </>
  )
}
