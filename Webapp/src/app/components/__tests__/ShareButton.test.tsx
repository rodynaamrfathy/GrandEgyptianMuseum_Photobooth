import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ShareButton from "../ShareButton";

jest.mock("lucide-react", () => ({
  Share2: ({ className }: { className: string }) => (
    <svg data-testid="share2-icon" className={className} />
  ),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: "en", changeLanguage: jest.fn() },
  }),
}));

describe("ShareButton Component", () => {
  const mockImageBlob = new Blob(["image data"], { type: "image/jpeg" });
  const mockCardBlob = new Blob(["card data"], { type: "image/png" });

  beforeEach(() => {
    Object.defineProperty(navigator, "canShare", { writable: true, value: jest.fn() });
    Object.defineProperty(navigator, "share", { writable: true, value: jest.fn() });
    global.window.open = jest.fn();
    global.alert = jest.fn();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("should render the share button", () => {
      render(<ShareButton imageBlob={mockImageBlob} cardBlob={mockCardBlob} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should display share icon", () => {
      render(<ShareButton imageBlob={mockImageBlob} cardBlob={mockCardBlob} />);
      expect(screen.getByTestId("share2-icon")).toBeInTheDocument();
    });

    it("should have aria-label", () => {
      render(<ShareButton imageBlob={mockImageBlob} cardBlob={mockCardBlob} />);
      expect(screen.getByRole("button")).toHaveAttribute("aria-label");
    });
  });

  describe("Web Share API - Success", () => {
    it("should use Web Share API when available and canShare returns true", async () => {
      (navigator.canShare as jest.Mock).mockReturnValue(true);
      (navigator.share as jest.Mock).mockResolvedValue(undefined);

      render(<ShareButton imageBlob={mockImageBlob} cardBlob={mockCardBlob} />);
      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(navigator.share).toHaveBeenCalled();
      });
    });

    it("should include title and text in share data", async () => {
      (navigator.canShare as jest.Mock).mockReturnValue(true);
      (navigator.share as jest.Mock).mockResolvedValue(undefined);

      render(<ShareButton imageBlob={mockImageBlob} cardBlob={mockCardBlob} />);
      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(navigator.share).toHaveBeenCalledWith(
          expect.objectContaining({ title: expect.any(String), text: expect.any(String) })
        );
      });
    });

    it("should not alert when user cancels the share sheet (AbortError)", async () => {
      (navigator.canShare as jest.Mock).mockReturnValue(true);
      (navigator.share as jest.Mock).mockRejectedValue(
        new DOMException("User cancelled", "AbortError")
      );

      render(<ShareButton imageBlob={mockImageBlob} cardBlob={mockCardBlob} />);
      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(navigator.share).toHaveBeenCalled();
        expect(global.alert).not.toHaveBeenCalled();
      });
    });
  });

  describe("Fallback Mechanism", () => {
    it("should use fallback when canShare returns false", async () => {
      (navigator.canShare as jest.Mock).mockReturnValue(false);

      render(<ShareButton imageBlob={mockImageBlob} cardBlob={mockCardBlob} />);
      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(window.open).toHaveBeenCalledTimes(2);
      });
    });

    it("should use fallback when canShare is not supported", async () => {
      (navigator as unknown as { canShare: undefined }).canShare = undefined;

      render(<ShareButton imageBlob={mockImageBlob} cardBlob={mockCardBlob} />);
      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(window.open).toHaveBeenCalled();
      });
    });
  });

  describe("Error Handling", () => {
    it("should alert on share API rejection (non-cancel)", async () => {
      (navigator.canShare as jest.Mock).mockReturnValue(true);
      (navigator.share as jest.Mock).mockRejectedValue(new Error("Share failed"));

      render(<ShareButton imageBlob={mockImageBlob} cardBlob={mockCardBlob} />);
      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled();
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have aria-label attribute", () => {
      render(<ShareButton imageBlob={mockImageBlob} cardBlob={mockCardBlob} />);
      expect(screen.getByRole("button")).toHaveAttribute("aria-label");
    });

    it("should be keyboard accessible", () => {
      render(<ShareButton imageBlob={mockImageBlob} cardBlob={mockCardBlob} />);
      const shareButton = screen.getByRole("button");
      shareButton.focus();
      expect(shareButton).toHaveFocus();
    });
  });
});
