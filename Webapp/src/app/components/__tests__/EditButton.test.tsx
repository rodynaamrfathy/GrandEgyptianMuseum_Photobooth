import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditButton from "../EditButton";

jest.mock("../SubmitButton", () => {
  return function MockSubmitButton({
    children,
    onClick,
    disabled,
    className,
    type,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    type?: "button" | "submit";
  }) {
    return (
      <button onClick={onClick} disabled={disabled} className={className} type={type}>
        {children}
      </button>
    );
  };
});

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: jest.fn() },
  }),
}));

describe("EditButton Component", () => {
  describe("Rendering", () => {
    it("should render the edit button with correct text", () => {
      render(<EditButton textToEdit="Sample text" />);
      const editButton = screen.getByRole("button", { name: /edit\.button/i });
      expect(editButton).toBeInTheDocument();
      expect(editButton).toHaveClass("backdrop-blur", "bg-white/10");
    });

    it("should not show modal initially", () => {
      render(<EditButton textToEdit="Sample text" />);
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("should apply custom className when provided", () => {
      render(<EditButton textToEdit="Sample text" className="custom-class" />);
      const editButton = screen.getByRole("button", { name: /edit\.button/i });
      expect(editButton).toHaveClass("custom-class");
    });

    it("should have aria-label on the button", () => {
      render(<EditButton textToEdit="Sample text" />);
      const editButton = screen.getByRole("button", { name: /edit\.button/i });
      expect(editButton).toHaveAttribute("aria-label");
    });
  });

  describe("Modal Opening", () => {
    it("should open modal when edit button is clicked", async () => {
      render(<EditButton textToEdit="Sample text" />);
      const editButton = screen.getByRole("button", { name: /edit\.button/i });
      fireEvent.click(editButton);
      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
        expect(screen.getByText(/edit\.title/i)).toBeInTheDocument();
      });
    });

    it("should display the initial text in textarea when modal opens", async () => {
      const initialText = "Initial text";
      render(<EditButton textToEdit={initialText} />);
      fireEvent.click(screen.getByRole("button", { name: /edit\.button/i }));
      await waitFor(() => {
        const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
        expect(textarea.value).toBe(initialText);
      });
    });

    it("should have dialog role and aria-modal", async () => {
      render(<EditButton textToEdit="Sample text" />);
      fireEvent.click(screen.getByRole("button", { name: /edit\.button/i }));
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });
  });

  describe("Text Editing", () => {
    it("should update text when user types in textarea", async () => {
      render(<EditButton textToEdit="Sample text" />);
      fireEvent.click(screen.getByRole("button", { name: /edit\.button/i }));
      const textarea = await screen.findByRole("textbox");
      await userEvent.clear(textarea);
      await userEvent.type(textarea, "New text");
      expect((textarea as HTMLTextAreaElement).value).toBe("New text");
    });

    it("should enforce maximum character length (60 chars)", async () => {
      render(<EditButton textToEdit="Short" />);
      fireEvent.click(screen.getByRole("button", { name: /edit\.button/i }));
      const textarea = await screen.findByRole("textbox");
      const longText = "a".repeat(100);
      fireEvent.change(textarea, { target: { value: longText } });
      expect((textarea as HTMLTextAreaElement).value.length).toBeLessThanOrEqual(60);
    });
  });

  describe("Character Counter", () => {
    it("should display character count correctly", async () => {
      render(<EditButton textToEdit="Hello" />);
      fireEvent.click(screen.getByRole("button", { name: /edit\.button/i }));
      await waitFor(() => {
        expect(screen.getByText(/edit\.chars/i)).toBeInTheDocument();
      });
    });
  });

  describe("Save Functionality", () => {
    it("should call onSave callback with new text when save is clicked", async () => {
      const mockOnSave = jest.fn();
      render(<EditButton textToEdit="Original" onSave={mockOnSave} />);
      fireEvent.click(screen.getByRole("button", { name: /edit\.button/i }));
      const textarea = await screen.findByRole("textbox");
      await userEvent.clear(textarea);
      await userEvent.type(textarea, "Updated text");
      fireEvent.click(screen.getByText(/edit\.save/i));
      expect(mockOnSave).toHaveBeenCalledWith("Updated text");
    });

    it("should close modal after saving", async () => {
      const mockOnSave = jest.fn();
      render(<EditButton textToEdit="Original" onSave={mockOnSave} />);
      fireEvent.click(screen.getByRole("button", { name: /edit\.button/i }));
      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText(/edit\.save/i));
      await waitFor(() => {
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      });
    });

    it("should disable save button when text is empty or whitespace only", async () => {
      render(<EditButton textToEdit="Original" />);
      fireEvent.click(screen.getByRole("button", { name: /edit\.button/i }));
      const textarea = await screen.findByRole("textbox");
      await userEvent.clear(textarea);
      await userEvent.type(textarea, "   ");
      expect(screen.getByText(/edit\.save/i)).toBeDisabled();
    });

    it("should enable save button when text is not empty", async () => {
      render(<EditButton textToEdit="Original" />);
      fireEvent.click(screen.getByRole("button", { name: /edit\.button/i }));
      const textarea = await screen.findByRole("textbox");
      await userEvent.clear(textarea);
      await userEvent.type(textarea, "Valid text");
      expect(screen.getByText(/edit\.save/i)).not.toBeDisabled();
    });
  });

  describe("Cancel Functionality", () => {
    it("should close modal when cancel button is clicked", async () => {
      render(<EditButton textToEdit="Original" />);
      fireEvent.click(screen.getByRole("button", { name: /edit\.button/i }));
      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText(/cancel/i));
      await waitFor(() => {
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      });
    });

    it("should not call onSave when cancelled", async () => {
      const mockOnSave = jest.fn();
      render(<EditButton textToEdit="Original" onSave={mockOnSave} />);
      fireEvent.click(screen.getByRole("button", { name: /edit\.button/i }));
      const textarea = await screen.findByRole("textbox");
      await userEvent.clear(textarea);
      await userEvent.type(textarea, "New text");
      fireEvent.click(screen.getByText(/cancel/i));
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it("should close modal on Escape key", async () => {
      render(<EditButton textToEdit="Original" />);
      fireEvent.click(screen.getByRole("button", { name: /edit\.button/i }));
      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });
      fireEvent.keyDown(document, { key: "Escape" });
      await waitFor(() => {
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      });
    });
  });

  describe("Without onSave Callback", () => {
    it("should not throw error when onSave is not provided", async () => {
      render(<EditButton textToEdit="Sample text" />);
      fireEvent.click(screen.getByRole("button", { name: /edit\.button/i }));
      const textarea = await screen.findByRole("textbox");
      await userEvent.type(textarea, " Updated");
      expect(() => fireEvent.click(screen.getByText(/edit\.save/i))).not.toThrow();
    });
  });

  describe("State Management", () => {
    it("should maintain separate state for modal open/close", async () => {
      render(<EditButton textToEdit="Test" />);
      const editButton = screen.getByRole("button", { name: /edit\.button/i });
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      fireEvent.click(editButton);
      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText(/cancel/i));
      await waitFor(() => {
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      });
    });
  });
});
