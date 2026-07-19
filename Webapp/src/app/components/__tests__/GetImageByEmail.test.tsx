import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GetImageByEmail from "../GetImageByEmail";

jest.mock("lucide-react", () => ({
  Mail: ({ className }: { className: string }) => (
    <svg data-testid="mail-icon" className={className} />
  ),
  Loader2: ({ className }: { className: string }) => (
    <svg data-testid="loader-icon" className={className} />
  ),
}));

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: jest.fn(() => "kiosk1_filter1_1234567890"),
  }),
}));

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

describe("GetImageByEmail Component (EmailButton)", () => {
  const mockCardBlob = new Blob(["card data"], { type: "image/png" });
  const mockUserEmail = "test@example.com";

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SEND_IMAGE_EMAIL_URL = "https://api.example.com/send-email";
    global.alert = jest.fn();

    // Mock FileReader for blobToBase64
    const mockFileReader = {
      onloadend: null as (() => void) | null,
      onerror: null as (() => void) | null,
      readAsDataURL: jest.fn(),
      result: "data:image/png;base64,abc123",
      error: null,
    };
    global.FileReader = jest.fn(() => mockFileReader) as unknown as typeof FileReader;

    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    ) as jest.Mock;
  });

  describe("Rendering", () => {
    it("should render email button with user email", () => {
      render(<GetImageByEmail cardBlob={mockCardBlob} userEmail={mockUserEmail} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should display mail icon when not sending", () => {
      render(<GetImageByEmail cardBlob={mockCardBlob} userEmail={mockUserEmail} />);
      expect(screen.getByTestId("mail-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("loader-icon")).not.toBeInTheDocument();
    });
  });

  describe("Email Validation", () => {
    it("should show alert when email is not provided", async () => {
      render(<GetImageByEmail cardBlob={mockCardBlob} userEmail="" />);
      fireEvent.click(screen.getByRole("button"));
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled();
      });
    });
  });

  describe("Email Sending - Success", () => {
    const createMockFileReader = () => {
      const reader: {
        onloadend: (() => void) | null;
        onerror: (() => void) | null;
        readAsDataURL: jest.Mock;
        result: string;
        error: null;
      } = {
        onloadend: null,
        onerror: null,
        readAsDataURL: jest.fn(function (this: typeof reader) {
          setTimeout(() => {
            this.onloadend?.();
          }, 0);
        }),
        result: "data:image/png;base64,abc123",
        error: null,
      };
      return reader;
    };

    beforeEach(() => {
      global.FileReader = jest.fn(() => createMockFileReader()) as unknown as typeof FileReader;
    });

    it("should send email with card data", async () => {
      render(<GetImageByEmail cardBlob={mockCardBlob} userEmail={mockUserEmail} />);
      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
        expect(fetchCall[0]).toBe("https://api.example.com/send-email");
        expect(fetchCall[1].method).toBe("POST");
      });
    });

    it("should show success alert on successful send", async () => {
      render(<GetImageByEmail cardBlob={mockCardBlob} userEmail={mockUserEmail} />);
      fireEvent.click(screen.getByRole("button"));
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled();
      });
    });
  });

  describe("Loading State", () => {
    const createMockFileReader = () => {
      const reader: {
        onloadend: (() => void) | null;
        onerror: (() => void) | null;
        readAsDataURL: jest.Mock;
        result: string;
        error: null;
      } = {
        onloadend: null,
        onerror: null,
        readAsDataURL: jest.fn(function (this: typeof reader) {
          setTimeout(() => {
            this.onloadend?.();
          }, 0);
        }),
        result: "data:image/png;base64,abc123",
        error: null,
      };
      return reader;
    };

    beforeEach(() => {
      global.FileReader = jest.fn(() => createMockFileReader()) as unknown as typeof FileReader;
    });

    it("should show loading spinner when sending", async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      (global.fetch as jest.Mock).mockReturnValueOnce(promise as Promise<Response>);

      render(<GetImageByEmail cardBlob={mockCardBlob} userEmail={mockUserEmail} />);
      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
      });
      resolvePromise!({ ok: true, json: () => Promise.resolve({}) });
      await waitFor(() => {
        expect(screen.getByTestId("mail-icon")).toBeInTheDocument();
      });
    });

    it("should disable button while sending", async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      (global.fetch as jest.Mock).mockReturnValueOnce(promise as Promise<Response>);

      render(<GetImageByEmail cardBlob={mockCardBlob} userEmail={mockUserEmail} />);
      const button = screen.getByRole("button");
      fireEvent.click(button);
      await waitFor(() => {
        expect(button).toBeDisabled();
      });
      resolvePromise!({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  describe("Error Handling", () => {
    const createMockFileReader = () => {
      const reader: {
        onloadend: (() => void) | null;
        onerror: (() => void) | null;
        readAsDataURL: jest.Mock;
        result: string;
        error: null;
      } = {
        onloadend: null,
        onerror: null,
        readAsDataURL: jest.fn(function (this: typeof reader) {
          setTimeout(() => {
            this.onloadend?.();
          }, 0);
        }),
        result: "data:image/png;base64,abc123",
        error: null,
      };
      return reader;
    };

    beforeEach(() => {
      global.FileReader = jest.fn(() => createMockFileReader()) as unknown as typeof FileReader;
    });

    it("should handle API error response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

      render(<GetImageByEmail cardBlob={mockCardBlob} userEmail={mockUserEmail} />);
      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled();
      });
    });
  });
});
