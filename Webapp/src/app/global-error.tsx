"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          background: "#0a0a0a",
          color: "#fff",
          fontFamily:
            "Greta Sans, Greta Arabic, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700, marginBottom: "1rem" }}>
          Something went wrong
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.7)",
            maxWidth: "32rem",
            textAlign: "center",
            marginBottom: "1.5rem",
          }}
        >
          An unexpected error occurred while loading this page.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "0.75rem 1.5rem",
            background: "#E87518",
            color: "#fff",
            border: "none",
            borderRadius: "1rem",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          Try again
        </button>
        {error.digest && (
          <p
            style={{
              marginTop: "1.5rem",
              color: "rgba(255,255,255,0.4)",
              fontSize: "0.75rem",
              fontFamily: "monospace",
            }}
          >
            ref: {error.digest}
          </p>
        )}
      </body>
    </html>
  );
}
