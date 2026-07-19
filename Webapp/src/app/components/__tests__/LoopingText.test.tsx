import "@testing-library/jest-dom";
import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import LoopingText from "../LoopingText";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: jest.fn() },
  }),
}));

describe("LoopingText Component", () => {
  const mockTexts = ["First text", "Second text", "Third text"];

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("Rendering", () => {
    it("should render the first text initially", () => {
      render(<LoopingText texts={mockTexts} />);
      expect(screen.getByText("First text")).toBeInTheDocument();
    });

    it("should render with custom className", () => {
      const { container } = render(<LoopingText texts={mockTexts} className="custom-class" />);
      expect(container.querySelector(".custom-class")).toBeInTheDocument();
    });

    it("should have default styling classes", () => {
      const { container } = render(<LoopingText texts={mockTexts} />);
      const textContainer = container.querySelector(".text-center");
      expect(textContainer).toBeInTheDocument();
      expect(textContainer).toHaveClass("flex", "justify-center", "items-center");
    });

    it("should have aria-live for screen readers", () => {
      const { container } = render(<LoopingText texts={mockTexts} />);
      expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument();
    });
  });

  describe("Text Cycling", () => {
    it("should cycle through texts at the specified interval", async () => {
      render(<LoopingText texts={mockTexts} interval={2500} />);
      expect(screen.getAllByText("First text").length).toBeGreaterThan(0);

      act(() => {
        jest.advanceTimersByTime(2800);
      });
      await waitFor(() => {
        expect(screen.getAllByText("Second text").length).toBeGreaterThan(0);
      });

      act(() => {
        jest.advanceTimersByTime(2500);
      });
      await waitFor(() => {
        expect(screen.getAllByText("Third text").length).toBeGreaterThan(0);
      });
    });

    it("should loop back to first text after reaching the end", async () => {
      render(<LoopingText texts={mockTexts} interval={1000} />);
      expect(screen.getAllByText("First text").length).toBeGreaterThan(0);

      act(() => {
        jest.advanceTimersByTime(1300);
      });
      await waitFor(() => {
        expect(screen.getAllByText("Second text").length).toBeGreaterThan(0);
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      await waitFor(() => {
        expect(screen.getAllByText("Third text").length).toBeGreaterThan(0);
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      await waitFor(() => {
        expect(screen.getAllByText("First text").length).toBeGreaterThan(0);
      });
    });

    it("should use custom interval when provided", async () => {
      render(<LoopingText texts={mockTexts} interval={5000} />);
      expect(screen.getAllByText("First text").length).toBeGreaterThan(0);

      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(screen.getAllByText("First text").length).toBeGreaterThan(0);

      act(() => {
        jest.advanceTimersByTime(2300);
      });
      await waitFor(() => {
        expect(screen.getAllByText("Second text").length).toBeGreaterThan(0);
      });
    });

    it("should use default interval (2500ms) when not provided", async () => {
      render(<LoopingText texts={mockTexts} />);
      expect(screen.getAllByText("First text").length).toBeGreaterThan(0);

      act(() => {
        jest.advanceTimersByTime(2800);
      });
      await waitFor(() => {
        expect(screen.getAllByText("Second text").length).toBeGreaterThan(0);
      });
    });
  });

  describe("Fade Animation", () => {
    it("should have fade in class initially", () => {
      const { container } = render(<LoopingText texts={mockTexts} />);
      expect(container.querySelector(".opacity-100")).toBeInTheDocument();
    });

    it("should apply transition classes", () => {
      const { container } = render(<LoopingText texts={mockTexts} />);
      const visibleText = container.querySelector(".transition-all");
      expect(visibleText).toBeInTheDocument();
      expect(visibleText).toHaveClass("duration-300", "ease-in-out");
    });
  });

  describe("Width Calculation", () => {
    it("should render invisible reference text for longest word", () => {
      const textsWithVaryingLengths = ["Short", "Medium text", "This is the longest text here"];
      const { container } = render(<LoopingText texts={textsWithVaryingLengths} />);
      const invisibleText = container.querySelector(".invisible");
      expect(invisibleText).toBeInTheDocument();
      expect(invisibleText).toHaveTextContent("This is the longest text here");
    });

    it("should mark reference text as aria-hidden", () => {
      const { container } = render(<LoopingText texts={mockTexts} />);
      const invisibleText = container.querySelector(".invisible");
      expect(invisibleText).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Timer Cleanup", () => {
    it("should clear interval on unmount", () => {
      const clearIntervalSpy = jest.spyOn(global, "clearInterval");
      const { unmount } = render(<LoopingText texts={mockTexts} />);
      unmount();
      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });

    it("should clear nested timeout on unmount", () => {
      const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");
      const { unmount } = render(<LoopingText texts={mockTexts} interval={1000} />);

      // Advance to trigger the nested setTimeout
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      unmount();
      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe("Edge Cases", () => {
    it("should handle single text without cycling", () => {
      render(<LoopingText texts={["Only text"]} />);
      expect(screen.getAllByText("Only text").length).toBeGreaterThan(0);
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(screen.getAllByText("Only text").length).toBeGreaterThan(0);
    });

    it("should handle two texts and cycle between them", async () => {
      const twoTexts = ["Text A", "Text B"];
      render(<LoopingText texts={twoTexts} interval={1000} />);
      expect(screen.getAllByText("Text A").length).toBeGreaterThan(0);

      act(() => {
        jest.advanceTimersByTime(1300);
      });
      await waitFor(() => {
        expect(screen.getAllByText("Text B").length).toBeGreaterThan(0);
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      await waitFor(() => {
        expect(screen.getAllByText("Text A").length).toBeGreaterThan(0);
      });
    });
  });

  describe("Container Layout", () => {
    it("should have relative positioning", () => {
      const { container } = render(<LoopingText texts={mockTexts} />);
      expect(container.querySelector(".relative")).toBeInTheDocument();
    });

    it("should have flex layout", () => {
      const { container } = render(<LoopingText texts={mockTexts} />);
      expect(container.querySelector(".flex")).toBeInTheDocument();
    });
  });
});
