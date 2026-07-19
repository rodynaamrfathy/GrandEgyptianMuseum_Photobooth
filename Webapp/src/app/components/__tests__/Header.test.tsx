import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Header from "../Header";

jest.mock("../../../lib/i18n", () => ({}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: "en",
      changeLanguage: jest.fn(),
    },
  }),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    width,
    height,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} />
  ),
}));

describe("Header Component", () => {
  describe("Rendering", () => {
    it("should render the header element", () => {
      render(<Header />);
      const header = screen.getByRole("banner");
      expect(header).toBeInTheDocument();
    });

    it("should render the GEM logo", () => {
      render(<Header />);
      const logo = screen.getByAltText("GEM Logo");
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute("src", "LOGO.svg");
    });

    it("should render logo with correct dimensions", () => {
      render(<Header />);
      const logo = screen.getByAltText("GEM Logo");
      expect(logo).toHaveAttribute("width", "80");
      expect(logo).toHaveAttribute("height", "80");
    });

    it("should render language change button", () => {
      render(<Header />);
      const languageButton = screen.getByRole("button");
      expect(languageButton).toBeInTheDocument();
    });
  });

  describe("Header Styling", () => {
    it("should have correct CSS classes", () => {
      render(<Header />);
      const header = screen.getByRole("banner");
      expect(header).toHaveClass("flex", "justify-between", "items-center", "p-4", "top-0", "z-40");
    });
  });

  describe("Language Button Initial State", () => {
    it("should display Arabic character when language is English", () => {
      render(<Header />);
      const languageButton = screen.getByRole("button");
      expect(languageButton).toHaveTextContent("ع");
    });

    it("should have correct button styling", () => {
      render(<Header />);
      const languageButton = screen.getByRole("button");
      expect(languageButton).toHaveClass(
        "text-xl",
        "font-bold",
        "bg-orange-500",
        "text-white",
        "rounded-[8px]",
        "w-8",
        "h-8",
        "flex",
        "items-center",
        "justify-center",
        "hover:bg-orange-600",
        "transition"
      );
    });

    it("should have aria-label for accessibility", () => {
      render(<Header />);
      const languageButton = screen.getByRole("button");
      expect(languageButton).toHaveAttribute("aria-label");
    });
  });

  describe("Language Toggle", () => {
    it("should be clickable", () => {
      render(<Header />);
      const languageButton = screen.getByRole("button");
      expect(languageButton).not.toBeDisabled();
      fireEvent.click(languageButton);
    });
  });

  describe("Component Structure", () => {
    it("should have header as the root element", () => {
      const { container } = render(<Header />);
      const header = container.querySelector("header");
      expect(header).toBeInTheDocument();
    });

    it("should contain both logo and language button", () => {
      render(<Header />);
      expect(screen.getByAltText("GEM Logo")).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Semantic HTML", () => {
    it("should use header tag for semantics", () => {
      render(<Header />);
      const header = screen.getByRole("banner");
      expect(header.tagName).toBe("HEADER");
    });
  });

  describe("Button Accessibility", () => {
    it("should have a button role", () => {
      render(<Header />);
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });
  });

  describe("Snapshot", () => {
    it("should match snapshot", () => {
      const { container } = render(<Header />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
