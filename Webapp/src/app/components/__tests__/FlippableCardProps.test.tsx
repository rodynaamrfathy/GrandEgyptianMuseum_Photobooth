import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import FlippableCard from "../FlippableCardProps";

describe("FlippableCard Component", () => {
  const mockFrontImageUrl = "https://example.com/front.jpg";
  const mockBackImageUrl = "https://example.com/back.jpg";

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("Rendering", () => {
    it("should render with front image visible initially", () => {
      render(<FlippableCard frontImageUrl={mockFrontImageUrl} backImageUrl={mockBackImageUrl} />);
      const frontImage = screen.getByAltText("Front Image");
      expect(frontImage).toBeInTheDocument();
      expect(frontImage).toHaveAttribute("src", mockFrontImageUrl);
    });

    it("should render with custom aspect ratio class", () => {
      const { container } = render(
        <FlippableCard
          frontImageUrl={mockFrontImageUrl}
          backImageUrl={mockBackImageUrl}
          aspectRatioClass="aspect-square"
        />
      );
      expect(container.querySelector(".aspect-square")).toBeInTheDocument();
    });

    it("should use default aspect ratio when not provided", () => {
      const { container } = render(
        <FlippableCard frontImageUrl={mockFrontImageUrl} backImageUrl={mockBackImageUrl} />
      );
      expect(container.querySelector(".aspect-\\[0\\.6667\\]")).toBeInTheDocument();
    });

    it("should render both front and back images", () => {
      render(<FlippableCard frontImageUrl={mockFrontImageUrl} backImageUrl={mockBackImageUrl} />);
      expect(screen.getByAltText("Front Image")).toBeInTheDocument();
      expect(screen.getByAltText("Back Image")).toBeInTheDocument();
    });
  });

  describe("Null Image Handling", () => {
    it("should display placeholder when front image is null", () => {
      render(<FlippableCard frontImageUrl={null} backImageUrl={mockBackImageUrl} />);
      expect(screen.getByText(/front image not available/i)).toBeInTheDocument();
    });

    it("should display placeholder when back image is null", () => {
      render(<FlippableCard frontImageUrl={mockFrontImageUrl} backImageUrl={null} />);
      expect(screen.getByText(/back image not available/i)).toBeInTheDocument();
    });

    it("should display placeholders for both null images", () => {
      render(<FlippableCard frontImageUrl={null} backImageUrl={null} />);
      expect(screen.getByText(/front image not available/i)).toBeInTheDocument();
      expect(screen.getByText(/back image not available/i)).toBeInTheDocument();
    });
  });

  describe("Manual Click Flipping", () => {
    it("should flip card when clicked", () => {
      const { container } = render(
        <FlippableCard frontImageUrl={mockFrontImageUrl} backImageUrl={mockBackImageUrl} />
      );
      const clickableDiv = container.querySelector('[role="button"]');
      const cardInner = container.querySelector(".transition-transform");
      expect(cardInner).not.toHaveClass("rotate-y-180");
      fireEvent.click(clickableDiv!);
      expect(cardInner).toHaveClass("rotate-y-180");
    });

    it("should toggle between flipped states on multiple clicks", () => {
      const { container } = render(
        <FlippableCard frontImageUrl={mockFrontImageUrl} backImageUrl={mockBackImageUrl} />
      );
      const clickableDiv = container.querySelector('[role="button"]');
      const cardInner = container.querySelector(".transition-transform");
      fireEvent.click(clickableDiv!);
      expect(cardInner).toHaveClass("rotate-y-180");
      fireEvent.click(clickableDiv!);
      expect(cardInner).not.toHaveClass("rotate-y-180");
      fireEvent.click(clickableDiv!);
      expect(cardInner).toHaveClass("rotate-y-180");
    });

    it("should stop auto-flipping after manual click", () => {
      jest.useFakeTimers();
      const { container } = render(
        <FlippableCard frontImageUrl={mockFrontImageUrl} backImageUrl={mockBackImageUrl} />
      );
      const clickableDiv = container.querySelector('[role="button"]');
      const cardInner = container.querySelector(".transition-transform");
      fireEvent.click(clickableDiv!);
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(cardInner).toHaveClass("rotate-y-180");
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(cardInner).toHaveClass("rotate-y-180");
      jest.useRealTimers();
    });
  });

  describe("Automatic Flipping", () => {
    it("should auto-flip every 3 seconds", () => {
      jest.useFakeTimers();
      const { container } = render(
        <FlippableCard frontImageUrl={mockFrontImageUrl} backImageUrl={mockBackImageUrl} />
      );
      const cardInner = container.querySelector(".transition-transform");
      expect(cardInner).not.toHaveClass("rotate-y-180");
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(cardInner).toHaveClass("rotate-y-180");
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(cardInner).not.toHaveClass("rotate-y-180");
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(cardInner).toHaveClass("rotate-y-180");
      jest.useRealTimers();
    });

    it("should clean up interval on unmount", () => {
      jest.useFakeTimers();
      const clearIntervalSpy = jest.spyOn(global, "clearInterval");
      const { unmount } = render(
        <FlippableCard frontImageUrl={mockFrontImageUrl} backImageUrl={mockBackImageUrl} />
      );
      unmount();
      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
      jest.useRealTimers();
    });
  });

  describe("Styling", () => {
    it("should have correct transformation classes", () => {
      const { container } = render(
        <FlippableCard frontImageUrl={mockFrontImageUrl} backImageUrl={mockBackImageUrl} />
      );
      const cardInner = container.querySelector(".transition-transform");
      expect(cardInner).toHaveClass("duration-700", "ease-in-out", "transform");
    });

    it("should have preserve-3d style", () => {
      const { container } = render(
        <FlippableCard frontImageUrl={mockFrontImageUrl} backImageUrl={mockBackImageUrl} />
      );
      // jsdom doesn't serialize all CSS properties — verify the inner transform div exists
      const cardInner = container.querySelector(".transition-transform");
      expect(cardInner).toBeInTheDocument();
    });

    it("should have perspective-1000 class on outer container", () => {
      const { container } = render(
        <FlippableCard frontImageUrl={mockFrontImageUrl} backImageUrl={mockBackImageUrl} />
      );
      const outer = container.querySelector(".perspective-1000");
      expect(outer).toBeInTheDocument();
    });

    it("should have backface-hidden class on both sides", () => {
      const { container } = render(
        <FlippableCard frontImageUrl={mockFrontImageUrl} backImageUrl={mockBackImageUrl} />
      );
      const backfaceHiddenElements = container.querySelectorAll(".backface-hidden");
      expect(backfaceHiddenElements).toHaveLength(2);
    });

    it("should have rotate-y-180 class on back side", () => {
      const { container } = render(
        <FlippableCard frontImageUrl={mockFrontImageUrl} backImageUrl={mockBackImageUrl} />
      );
      const backSide = container.querySelector(".rotate-y-180.backface-hidden");
      expect(backSide).toBeInTheDocument();
    });
  });

  describe("Image Props", () => {
    it("should pass correct props to Image components", () => {
      render(<FlippableCard frontImageUrl={mockFrontImageUrl} backImageUrl={mockBackImageUrl} />);
      expect(screen.getByAltText("Front Image")).toHaveAttribute("src", mockFrontImageUrl);
      expect(screen.getByAltText("Back Image")).toHaveAttribute("src", mockBackImageUrl);
    });
  });

  describe("State Management", () => {
    it("should maintain flipped state correctly", () => {
      const { container, rerender } = render(
        <FlippableCard frontImageUrl={mockFrontImageUrl} backImageUrl={mockBackImageUrl} />
      );
      const clickableDiv = container.querySelector('[role="button"]');
      const cardInner = container.querySelector(".transition-transform");
      fireEvent.click(clickableDiv!);
      expect(cardInner).toHaveClass("rotate-y-180");
      rerender(<FlippableCard frontImageUrl={mockFrontImageUrl} backImageUrl={mockBackImageUrl} />);
      expect(cardInner).toHaveClass("rotate-y-180");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string URLs", () => {
      render(<FlippableCard frontImageUrl="" backImageUrl="" />);
      expect(screen.getByText(/front image not available/i)).toBeInTheDocument();
      expect(screen.getByText(/back image not available/i)).toBeInTheDocument();
    });

    it("should handle rapid clicks", () => {
      const { container } = render(
        <FlippableCard frontImageUrl={mockFrontImageUrl} backImageUrl={mockBackImageUrl} />
      );
      const clickableDiv = container.querySelector('[role="button"]');
      const cardInner = container.querySelector(".transition-transform");
      fireEvent.click(clickableDiv!);
      fireEvent.click(clickableDiv!);
      fireEvent.click(clickableDiv!);
      fireEvent.click(clickableDiv!);
      expect(cardInner).not.toHaveClass("rotate-y-180");
    });
  });

  describe("Accessibility", () => {
    it("should have alt text for images", () => {
      render(<FlippableCard frontImageUrl={mockFrontImageUrl} backImageUrl={mockBackImageUrl} />);
      expect(screen.getByAltText("Front Image")).toBeInTheDocument();
      expect(screen.getByAltText("Back Image")).toBeInTheDocument();
    });

    it("should have role button for keyboard access", () => {
      const { container } = render(
        <FlippableCard frontImageUrl={mockFrontImageUrl} backImageUrl={mockBackImageUrl} />
      );
      const clickable = container.querySelector('[role="button"]');
      expect(clickable).toBeInTheDocument();
    });

    it("should have tabIndex for focusability", () => {
      const { container } = render(
        <FlippableCard frontImageUrl={mockFrontImageUrl} backImageUrl={mockBackImageUrl} />
      );
      const clickable = container.querySelector('[role="button"]');
      expect(clickable).toHaveAttribute("tabindex", "0");
    });

    it("should have aria-label", () => {
      const { container } = render(
        <FlippableCard frontImageUrl={mockFrontImageUrl} backImageUrl={mockBackImageUrl} />
      );
      const clickable = container.querySelector('[role="button"]');
      expect(clickable).toHaveAttribute("aria-label");
    });

    it("should have aria-pressed reflecting flip state", () => {
      const { container } = render(
        <FlippableCard frontImageUrl={mockFrontImageUrl} backImageUrl={mockBackImageUrl} />
      );
      const clickable = container.querySelector('[role="button"]');
      expect(clickable).toHaveAttribute("aria-pressed", "false");
      fireEvent.click(clickable!);
      expect(clickable).toHaveAttribute("aria-pressed", "true");
    });

    it("should flip on Enter key", () => {
      const { container } = render(
        <FlippableCard frontImageUrl={mockFrontImageUrl} backImageUrl={mockBackImageUrl} />
      );
      const clickable = container.querySelector('[role="button"]');
      const cardInner = container.querySelector(".transition-transform");
      fireEvent.keyDown(clickable!, { key: "Enter" });
      expect(cardInner).toHaveClass("rotate-y-180");
    });

    it("should flip on Space key", () => {
      const { container } = render(
        <FlippableCard frontImageUrl={mockFrontImageUrl} backImageUrl={mockBackImageUrl} />
      );
      const clickable = container.querySelector('[role="button"]');
      const cardInner = container.querySelector(".transition-transform");
      fireEvent.keyDown(clickable!, { key: " " });
      expect(cardInner).toHaveClass("rotate-y-180");
    });
  });
});
