'use client';
import styles from "../styles/page.module.css";
import LoginForm from "../components/login/LoginForm";

export default function LandingPage() {
  return (
    <>
      <div className={styles.page}>
        Landing Page
        <LoginForm></LoginForm>
      </div>
    </>
  )
}
