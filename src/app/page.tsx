'use client';
import styles from "./styles/page.module.css";
import LoginForm from "../components/LoginForm";

export default function LandingPage() {
  return (
    <>
      <div className={styles.page}>
        Landing Page
      </div>
      <div className={styles.page}>
        <LoginForm/>
      </div>
    </>
  )
}
