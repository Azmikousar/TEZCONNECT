import { useState, useEffect } from "react";
import { supabase } from "./supabase";

/* ═══════════════════════════════════════════════════════════
   UPDATE PASSWORD PAGE
═══════════════════════════════════════════════════════════ */
function UpdatePasswordPage({ onNav }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const updatePassword = async () => {
    // Basic validation
    if (!password) {
      setError("Password is required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");

    // Supabase update request
    const { error: supabaseError } = await supabase.auth.updateUser({ password });
    
    if (supabaseError) {
      setError(supabaseError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      // Wait 2.5s before redirecting user to sign in
      setTimeout(() => {
        onNav("signin");
      }, 2500);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 20px",
        position: "relative",
      }}
    >
      <Background />
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: 20 }}>
            <Logo size="lg" />
          </div>
          <h1
            style={{
              fontFamily: "'Instrument Serif',serif",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 28,
              color: T.text,
              marginBottom: 6,
            }}
          >
            Create New Password
          </h1>
          <p style={{ color: T.textMid, fontSize: 13 }}>
            Please enter a strong new password for your account.
          </p>
        </div>

        <AuthCard>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {error && (
              <Alert type="error" onDismiss={() => setError("")}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert type="success">
                Password updated successfully! Redirecting to sign in...
              </Alert>
            )}

            <div onKeyDown={(e) => e.key === "Enter" && updatePassword()}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Field
                  label="New Password"
                  type="password"
                  value={password}
                  onChange={(v) => {
                    setPassword(v);
                    setError("");
                  }}
                  placeholder="Minimum 8 characters"
                  icon="🔒"
                />
                <PasswordStrength pwd={password} />
              </div>
            </div>

            <div style={{ paddingTop: 4 }}>
              <Btn onClick={updatePassword} loading={loading} disabled={success} fullWidth>
                Update Password
              </Btn>
            </div>
          </div>
        </AuthCard>
      </div>
    </div>
  );
}
