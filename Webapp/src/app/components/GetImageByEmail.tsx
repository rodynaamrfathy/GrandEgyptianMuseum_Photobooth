"use client";
import { Mail, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {useSearchParams} from "next/navigation";

interface EmailButtonProps {
    cardBlob: Blob;   // The generated card blob
    className?: string;
}

const EmailButton: React.FC<EmailButtonProps> = ({cardBlob, className }) => {
    const { t } = useTranslation();
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const searchParams = useSearchParams();
    const imageId = searchParams.get("image");

    useEffect(() => {
        // Read initial email from localStorage
        const savedEmail = localStorage.getItem("userEmail");
        if (savedEmail) setUserEmail(savedEmail);

        // Listen for storage changes from other components/tabs
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "userEmail" && e.newValue) {
                setUserEmail(e.newValue);
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    // Helper to convert Blob to Base64 for the Lambda payload
    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(",")[1];
                resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleEmail = async () => {
        if (!userEmail) {
            alert(t("alerts.noEmail"));
            return;
        }

        setIsSending(true);

        try {
            // 1. Convert the Card Blob to Base64
            const cardBase64 = await blobToBase64(cardBlob);

            // 2. Call the Send Image Email Lambda
            const res = await fetch(process.env.NEXT_PUBLIC_SEND_IMAGE_EMAIL_URL || "", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: userEmail,
                    imageId,
                    cardBase64: cardBase64,
                    cardName: "GEM_Custom_Card.png"
                }),
            });

            if (!res.ok) throw new Error("Email dispatch failed");

            alert(t("alerts.saveSuccess", { email: userEmail }));
        } catch (error) {
            console.error("Error sending email:", error);
            alert(t("alerts.prepareError"));
        } finally {
            setIsSending(false);
        }
    };

    return (
        <button
            onClick={handleEmail}
            disabled={isSending}
            className={`w-full rounded-2xl py-4 px-6 shadow-lg hover:shadow-xl 
                  transition-all duration-300 flex items-center justify-center 
                  space-x-3 backdrop-blur bg-white/10 border border-white/20 
                  disabled:opacity-50 disabled:cursor-not-allowed font-sans ${className || ""}`}
        >
            {isSending ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
                <Mail className="w-5 h-5 text-white" />
            )}
            <span className="text-white font-medium font-sans">
        {isSending
            ? t("share.sending")
            : userEmail ? t("share.emailWith", { email: userEmail }) : t("share.email")
        }
      </span>
        </button>
    );
};

export default EmailButton;