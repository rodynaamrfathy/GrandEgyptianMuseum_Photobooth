"use client";
import { useState, useEffect } from "react";
import SubmitButton from "./SubmitButton";

interface EmailPopupProps {
  onSubmit: (email: string) => void;
  imageName: string;
  cardName: string;
  kioskName?: string;
  filterName?: string;
}

export default function EmailPopup({
  onSubmit,
  imageName,
  cardName,
  kioskName,
  filterName,
}: EmailPopupProps) {
  const [email, setEmail] = useState("");
  const [prevEmail, setPrevEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load email from localStorage if it exists
  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    if (storedEmail) {
      setPrevEmail(storedEmail);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveEmail(email);
  };

  const saveEmail = async (emailToSave: string) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailToSave.trim() || !emailPattern.test(emailToSave)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/save-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailToSave,
          image_name: imageName,
          card_name: cardName,
          kiosk_name: kioskName,
          filter_name: filterName,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem("userEmail", emailToSave);
        onSubmit(emailToSave); // notify parent
      } else {
        setError(data.error || "Failed to save email.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">
      <div className="bg-[#AFAFAF]/20 border border-white/10 backdrop-blur-md shadow-[0_4px_4px_rgba(0,0,0,0.25)] p-6 rounded-[32px] max-w-sm w-full text-white font-sans">
        <h2 className="text-xl font-bold mb-4 text-center font-sans">
          Enter your email to view and share your images
        </h2>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-[16px] bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none font-sans"
          />

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <div className="flex flex-col gap-2 mt-2">
            <SubmitButton type="submit" disabled={!email.trim() || loading}>
              {loading ? "Saving..." : "Submit"}
            </SubmitButton>

            {prevEmail && (
              <button
                type="button"
                onClick={() => saveEmail(prevEmail)}
                className="px-4 py-2 bg-[#E87518] text-white rounded-[16px] hover:bg-[#E87518] hover:text-white transition font-sans"
              >
                Use previous email ({prevEmail})
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
