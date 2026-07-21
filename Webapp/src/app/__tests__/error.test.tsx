import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorBoundary from "../error";

jest.mock("../../lib/i18n", () => ({}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: jest.fn() },
  }),
}));

describe("Error boundary", () => {
  const mockError = new Error("boom") as Error & { digest?: string };

  it("renders the error title and message", () => {
    render(<ErrorBoundary error={mockError} reset={() => {}} />);
    expect(screen.getByText("error.title")).toBeInTheDocument();
    expect(screen.getByText("error.message")).toBeInTheDocument();
  });

  it("renders a retry button that calls reset", () => {
    const reset = jest.fn();
    render(<ErrorBoundary error={mockError} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: "error.retry" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("shows the error digest reference when present", () => {
    const errWithDigest = Object.assign(new Error("x"), { digest: "abc123" });
    render(<ErrorBoundary error={errWithDigest} reset={() => {}} />);
    expect(screen.getByText(/abc123/)).toBeInTheDocument();
  });

  it("hides the digest block when no digest is present", () => {
    render(<ErrorBoundary error={mockError} reset={() => {}} />);
    expect(screen.queryByText(/ref:/)).not.toBeInTheDocument();
  });
});
