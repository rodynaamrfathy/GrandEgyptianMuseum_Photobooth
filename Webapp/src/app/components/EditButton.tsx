"use client";
import { useState } from "react";
import { Edit } from "lucide-react";
import SubmitButton from "./SubmitButton";

import { useTranslation } from "react-i18next";

interface EditButtonProps {
  textToEdit: string;
  onSave?: (newText: string) => void;
  className?: string;
}

const MAX_LENGTH = 60;
const MAX_LINES = 3;
const CHARS_PER_LINE = 25;

const EditButton: React.FC<EditButtonProps> = ({ textToEdit, onSave, className }) => {
  const { t } = useTranslation();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [text, setText] = useState(textToEdit);

  const handleEditClick = () => {
    setIsEditOpen(true);
    setText(textToEdit); // restore original text when opening
  };

  const handleEditSave = () => {
    setIsEditOpen(false);
    if (onSave) {
      onSave(text);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;

    // Restrict max length
    if (value.length > MAX_LENGTH) {
      value = value.slice(0, MAX_LENGTH);
    }

    // Auto-break lines every 25 chars
    const regex = new RegExp(`.{1,${CHARS_PER_LINE}}`, "g");
    const lines = value.match(regex) || [];

    // Enforce max lines
    setText(lines.slice(0, MAX_LINES).join("\n"));
  };

  return (
    <>
      {/* Main button */}
      <button
        onClick={handleEditClick}
        className={`w-full rounded-2xl py-4 px-6 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-3 backdrop-blur bg-white/10 border border-white/20 font-sans ${className || ""}`}
      >
        <Edit className="w-5 h-5 text-white" />
        <span className="text-white font-medium font-sans">
          {t("edit.button")}
        </span>
      </button>

      {/* Modal editor */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#AFAFAF]/20 border border-white/10 backdrop-blur-lg shadow-[0_4px_4px_rgba(0,0,0,0.25)] p-4 rounded-[32px] max-w-sm w-full text-white font-sans">
            <h3 className="font-bold mb-3 text-lg text-white text-center font-sans">
              {t("edit.title")}
            </h3>

            {/* Textarea */}
            <textarea
              className="w-full p-2 rounded-[16px] bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none font-sans"
              rows={3}
              maxLength={MAX_LENGTH + MAX_LINES}
              value={text}
              placeholder={t("edit.placeholder")}
              onChange={handleTextChange}
            />

            {/* Character counter */}
            <div className="text-right text-sm text-white/60 mt-1 font-sans">
              {t("edit.chars", { count: text.replace(/\n/g, "").length, max: MAX_LENGTH })}
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-2 mt-3">
              <button
                onClick={() => setIsEditOpen(false)}
                className="mx-5 px-3 py-1.5 bg-white/20 border border-white/30 text-white rounded-[16px] hover:bg-white/30 transition font-sans"
              >
                Cancel
              </button>
                <SubmitButton onClick={handleEditSave} disabled={!text.trim()} className="px-3 py-1.5">
                  {t("edit.save")}
                </SubmitButton>

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditButton;
