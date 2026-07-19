import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import Footer from "../Footer";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: jest.fn() },
  }),
}));

describe("Footer Component", () => {
  describe("Rendering", () => {
    it("should render footer with text content", () => {
      render(<Footer />);
      const footer = screen.getByRole("contentinfo");
      expect(footer).toBeInTheDocument();
    });

    it("should display footer text from translation", () => {
      render(<Footer />);
      expect(screen.getByText(/footer\.text/i)).toBeInTheDocument();
    });

    it("should display team text from translation", () => {
      render(<Footer />);
      expect(screen.getByText(/footer\.team/i)).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should have correct text color classes", () => {
      render(<Footer />);
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass("text-[#FFFFFF]", "dark:text-[#FFFFFF]");
    });

    it("should have text-center class", () => {
      render(<Footer />);
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass("text-center");
    });

    it("should have correct padding class", () => {
      render(<Footer />);
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass("p-4");
    });

    it("should have correct text size class", () => {
      render(<Footer />);
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass("text-[10px]");
    });

    it("should have font-greta-sans class", () => {
      render(<Footer />);
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass("font-greta-sans");
    });
  });

  describe("Team Text Styling", () => {
    it("should have orange color for team text", () => {
      render(<Footer />);
      const teamText = screen.getByText(/footer\.team/i);
      expect(teamText).toHaveClass("text-[#EE7103]");
    });
  });

  describe("Semantic HTML", () => {
    it("should use footer tag", () => {
      const { container } = render(<Footer />);
      const footer = container.querySelector("footer");
      expect(footer).toBeInTheDocument();
    });
  });

  describe("Content Structure", () => {
    it("should render both footer text and team text together", () => {
      render(<Footer />);
      expect(screen.getByText(/footer\.text/i)).toBeInTheDocument();
      expect(screen.getByText(/footer\.team/i)).toBeInTheDocument();
    });

    it("should have team text as a span element", () => {
      const { container } = render(<Footer />);
      const teamSpan = container.querySelector("span.text-\\[\\#EE7103\\]");
      expect(teamSpan).toBeInTheDocument();
    });
  });

  describe("Snapshot", () => {
    it("should match snapshot", () => {
      const { container } = render(<Footer />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
