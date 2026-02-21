"use client";

import { SignIn } from "@clerk/nextjs";

export default function AuthPage() {

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      padding: "0 1rem",
    }}>
      <h1>Authentication Required</h1>
      <p style={
        {
          "marginBottom": "5rem"
        }
      }>You've reached your free usage limit. Please sign in or create an account to continue.</p>
        <SignIn routing="hash" />
    </div>
  );
}
