"use client";

import { useState, useRef, useCallback } from "react";
import { Edit } from "lucide-react";
import SubmitButton from "./SubmitButton";
import { useTranslation } from "react-i18next";
import { useFocusTrap } from "../hooks/useFocusTrap";
import {
  MAX_TEXT_LENGTH,
  MAX_TEXT_LINES,
} from "../constants/cardText";

export interface EditButtonProps {
  textToEdit: string;
  onSave?: (newText: string) => void;
  className?: string;
}

const EditButton: React.FC<EditButtonProps> = ({ textToEdit, onSave, className }) => {
  const { t } = useTranslation();

  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [text, setText] = useState<string>(textToEdit);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleEditClick = useCallback((): void => {
    setIsEditOpen(true);
    setText(textToEdit);
  }, [textToEdit]);

  const handleEditSave = useCallback((): void => {
    setIsEditOpen(false);
    onSave?.(text);
  }, [onSave, text]);

  const handleClose = useCallback((): void => {
    setIsEditOpen(false);
  }, []);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const value = e.target.value.slice(0, MAX_TEXT_LENGTH);
    setText(value);
  }, []);

  useFocusTrap(modalRef, isEditOpen, handleClose);

  return (
    <>
      <button
        onClick={handleEditClick}
        aria-label={t("edit.button")}
        className={`w-full rounded-2xl py-4 px-6 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-3 backdrop-blur bg-white/10 border border-white/20 font-greta-sans focus:outline-none focus:ring-2 focus:ring-orange-300 ${className || ""}`}
      >
        <Edit className="w-5 h-5 text-white" aria-hidden="true" />
        <span className="text-white font-medium font-greta-sans">
          {t("edit.button")}
        </span>
      </button>

      {isEditOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-label={t("edit.title")}
        >
          <div
            ref={modalRef}
            className="bg-[#AFAFAF]/20 border border-white/10 backdrop-blur-lg shadow-[0_4px_4px_rgba(0,0,0,0.25)] p-4 rounded-[32px] max-w-sm w-full text-white font-greta-sans"
          >
            <h3 className="font-bold mb-3 text-lg text-white text-center font-greta-sans">
              {t("edit.title")}
            </h3>

            <textarea
              className="w-full p-2 rounded-[16px] bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-300 font-greta-sans"
              rows={3}
              maxLength={MAX_TEXT_LENGTH + MAX_TEXT_LINES}
              value={text}
              placeholder={t("edit.placeholder")}
              onChange={handleTextChange}
              aria-label={t("edit.placeholder")}
            />

            <div
              className="text-right text-sm text-white/60 mt-1 font-greta-sans"
              aria-live="polite"
            >
              {t("edit.chars", {
                count: text.replace(/\n/g, "").length,
                max: MAX_TEXT_LENGTH,
              })}
            </div>

            <div className="flex justify-end space-x-2 mt-3">
              <button
                onClick={handleClose}
                aria-label={t("edit.cancel")}
                className="mx-5 px-3 py-1.5 bg-white/20 border border-white/30 text-white rounded-[16px] hover:bg-white/30 transition font-greta-sans focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                {t("edit.cancel")}
              </button>
              <SubmitButton
                onClick={handleEditSave}
                disabled={!text.trim()}
                className="px-3 py-1.5"
                aria-label={t("edit.save")}
              >
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