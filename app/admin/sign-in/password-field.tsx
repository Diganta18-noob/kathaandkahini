"use client";

import { useState } from "react";
import styles from "./sign-in.module.css";

export default function PasswordField({ invalid }: { invalid: boolean }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.passwordField}>
      <input
        className={styles.password}
        id="password"
        name="password"
        type={visible ? "text" : "password"}
        autoComplete="current-password"
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? "sign-in-error" : undefined}
        required
      />
      <button
        className={styles.visibility}
        type="button"
        aria-controls="password"
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible(value => !value)}
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}
