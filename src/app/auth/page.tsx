import Link from "next/link";

export default function AuthPage() {
  return (
    <main style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      textAlign: "center",
      padding: "0 1rem",
    }}>
      <h1>Authentication Required</h1>
      <p>You've reached your free usage limit. Please sign in or upgrade to continue using the AI features.</p>
      <Link href="/" style={{ marginTop: "1rem", color: "blue" }}>
        ← Go back to home
      </Link>
    </main>
  );
}
