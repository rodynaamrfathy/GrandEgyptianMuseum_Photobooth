import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import GlobalError from "../global-error";

describe("GlobalError", () => {
  const mockError = new Error("boom") as Error & { digest?: string };

  it("renders an html and body element (root-level fallback)", () => {
    const { container } = render(<GlobalError error={mockError} reset={() => {}} />);
    expect(container.querySelector("html")).toBeInTheDocument();
    expect(container.querySelector("body")).toBeInTheDocument();
  });

  it("shows a heading and a retry button", () => {
    render(<GlobalError error={mockError} reset={() => {}} />);
    expect(
      screen.getByRole("heading", { level: 1, name: /something went wrong/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("renders the digest reference when present", () => {
    const errWithDigest = Object.assign(new Error("x"), { digest: "def456" });
    render(<GlobalError error={errWithDigest} reset={() => {}} />);
    expect(screen.getByText(/def456/)).toBeInTheDocument();
  });
});
