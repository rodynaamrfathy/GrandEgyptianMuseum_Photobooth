import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmailPopup from "../EmailPopup";

const mockGet = jest.fn();
jest.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: mockGet }),
}));

jest.mock("../SubmitButton", () => {
  return function MockSubmitButton({
    children,
    disabled,
    type,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: string;
  }) {
    return (
      <button disabled={disabled} type={type as "button" | "submit" | undefined}>
        {children}
      </button>
    );
  };
});

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (options && typeof options === "object") {
        let result = key;
        Object.keys(options).forEach((optKey) => {
          result = result.replace(`{{${optKey}}}`, String(options[optKey]));
        });
        return result;
      }
      return key;
    },
    i18n: { language: "en", changeLanguage: jest.fn() },
  }),
}));

const mockFetch = global.fetch as jest.Mock;

describe("EmailPopup Component", () => {
  const mockOnSubmit = jest.fn();
  const mockImageId = "kiosk1_filter1_1234567890";

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockGet.mockReturnValue(mockImageId);
    process.env.NEXT_PUBLIC_SAVE_EMAIL_URL = "https://api.example.com/save-email";
  });

  describe("Rendering", () => {
    it("should render the email popup with title and input field", () => {
      render(<EmailPopup onSubmit={mockOnSubmit} />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
    });

    it("should have submit button disabled when email is empty", () => {
      render(<EmailPopup onSubmit={mockOnSubmit} />);
      expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();
    });
  });

  describe("Email Input", () => {
    it("should update email state when user types", async () => {
      render(<EmailPopup onSubmit={mockOnSubmit} />);
      const emailInput = screen.getByRole("textbox");
      await userEvent.type(emailInput, "test@example.com");
      expect(emailInput).toHaveValue("test@example.com");
    });

    it("should enable submit button when email has value", async () => {
      render(<EmailPopup onSubmit={mockOnSubmit} />);
      await userEvent.type(screen.getByRole("textbox"), "test@example.com");
      expect(screen.getByRole("button", { name: /submit/i })).not.toBeDisabled();
    });
  });

  describe("Email Validation", () => {
    it("should show error for invalid email format", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
      render(<EmailPopup onSubmit={mockOnSubmit} />);
      const emailInput = screen.getByRole("textbox");
      await userEvent.type(emailInput, "invalid-email");
      fireEvent.submit(screen.getByRole("textbox").closest("form")!);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should not show error for valid email format", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
      render(<EmailPopup onSubmit={mockOnSubmit} />);
      await userEvent.type(screen.getByRole("textbox"), "valid@example.com");
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe("Form Submission - Success", () => {
    it("should call API with correct data on submit", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
      render(<EmailPopup onSubmit={mockOnSubmit} />);
      await userEvent.type(screen.getByRole("textbox"), "user@example.com");
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.example.com/save-email",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: "user@example.com",
              kiosk_name: "kiosk1",
              filter_name: "filter1",
              timestamp: "1234567890",
            }),
          })
        );
      });
    });

    it("should save email to localStorage on successful submission", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
      render(<EmailPopup onSubmit={mockOnSubmit} />);
      await userEvent.type(screen.getByRole("textbox"), "user@example.com");
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));
      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith("userEmail", "user@example.com");
      });
    });

    it("should call onSubmit callback on successful save", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
      render(<EmailPopup onSubmit={mockOnSubmit} />);
      await userEvent.type(screen.getByRole("textbox"), "user@example.com");
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith("user@example.com");
      });
    });

    it("should show loading state during submission", async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockFetch.mockReturnValueOnce(promise as Promise<Response>);

      render(<EmailPopup onSubmit={mockOnSubmit} />);
      await userEvent.type(screen.getByRole("textbox"), "user@example.com");
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        expect(screen.getByText(/saving/i)).toBeInTheDocument();
      });
      resolvePromise!({ ok: true, json: async () => ({ success: true }) });
      await waitFor(() => {
        expect(screen.getByText(/submit/i)).toBeInTheDocument();
      });
    });
  });

  describe("Form Submission - Error Handling", () => {
    beforeEach(() => {
      jest.spyOn(console, "error").mockImplementation(() => {});
      // Reset fetch mock to clear any leftover mockResolvedValueOnce from prior tests
      (global.fetch as jest.Mock).mockReset();
      (global.fetch as jest.Mock).mockImplementation(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      );
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should display error message when API returns error", async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ success: false, error: "Email already exists" }),
        })
      );

      const { container } = render(<EmailPopup onSubmit={mockOnSubmit} />);
      await userEvent.type(screen.getByPlaceholderText(/you@example/i), "user@example.com");

      await act(async () => {
        fireEvent.submit(container.querySelector("form")!);
        await new Promise((r) => setTimeout(r, 300));
      });

      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should handle network errors gracefully", async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.reject(new Error("Network error"))
      );

      const { container } = render(<EmailPopup onSubmit={mockOnSubmit} />);
      await userEvent.type(screen.getByPlaceholderText(/you@example/i), "user@example.com");

      await act(async () => {
        fireEvent.submit(container.querySelector("form")!);
        await new Promise((r) => setTimeout(r, 300));
      });

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  describe("Previous Email", () => {
    it("should display previous email button when email exists in localStorage", async () => {
      jest.spyOn(localStorage, "getItem").mockReturnValue("previous@example.com");
      render(<EmailPopup onSubmit={mockOnSubmit} />);
      await waitFor(() => {
        expect(screen.getByText(/previous@example.com/i)).toBeInTheDocument();
      });
    });

    it("should submit with previous email when button is clicked", async () => {
      jest.spyOn(localStorage, "getItem").mockReturnValue("previous@example.com");
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

      render(<EmailPopup onSubmit={mockOnSubmit} />);
      await waitFor(() => {
        expect(screen.getByText(/previous@example.com/i)).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText(/previous@example.com/i));
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ body: expect.stringContaining("previous@example.com") })
        );
      });
    });
  });

  describe("URL Parameter Parsing", () => {
    it("should parse imageId from URL parameters correctly", async () => {
      mockGet.mockReturnValue("kiosk2_filter3_9876543210");
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
      render(<EmailPopup onSubmit={mockOnSubmit} />);
      await userEvent.type(screen.getByRole("textbox"), "user@example.com");
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({
              email: "user@example.com",
              kiosk_name: "kiosk2",
              filter_name: "filter3",
              timestamp: "9876543210",
            }),
          })
        );
      });
    });

    it("should handle missing imageId gracefully", async () => {
      mockGet.mockReturnValue(null);
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
      render(<EmailPopup onSubmit={mockOnSubmit} />);
      await userEvent.type(screen.getByRole("textbox"), "user@example.com");
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({
              email: "user@example.com",
              kiosk_name: "",
              filter_name: "",
              timestamp: "",
            }),
          })
        );
      });
    });
  });

  describe("Suspense Boundary", () => {
    it("should render without crashing when wrapped in Suspense", () => {
      const { container } = render(<EmailPopup onSubmit={mockOnSubmit} />);
      expect(container).toBeInTheDocument();
    });
  });
});
