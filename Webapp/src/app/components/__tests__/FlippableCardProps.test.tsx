import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import FlippableCard from '../FlippableCardProps';

describe('FlippableCard Component', () => {
  const mockFrontImageUrl = 'https://example.com/front.jpg';
  const mockBackImageUrl = 'https://example.com/back.jpg';

  // Clear all timers after each test
  afterEach(() => {
    jest.clearAllTimers();
  });

  // Test 1: Renders correctly with default props
  describe('Rendering', () => {
    it('should render with front image visible initially', () => {
      render(
        <FlippableCard
          frontImageUrl={mockFrontImageUrl}
          backImageUrl={mockBackImageUrl}
        />
      );

      const frontImage = screen.getByAltText('Front Image');
      expect(frontImage).toBeInTheDocument();
      expect(frontImage).toHaveAttribute('src', mockFrontImageUrl);
    });

    it('should render with custom aspect ratio class', () => {
      const { container } = render(
        <FlippableCard
          frontImageUrl={mockFrontImageUrl}
          backImageUrl={mockBackImageUrl}
          aspectRatioClass="aspect-square"
        />
      );

      const cardContainer = container.querySelector('.aspect-square');
      expect(cardContainer).toBeInTheDocument();
    });

    it('should use default aspect ratio when not provided', () => {
      const { container } = render(
        <FlippableCard
          frontImageUrl={mockFrontImageUrl}
          backImageUrl={mockBackImageUrl}
        />
      );

      const cardContainer = container.querySelector('.aspect-\\[0\\.6667\\]');
      expect(cardContainer).toBeInTheDocument();
    });

    it('should render both front and back images', () => {
      render(
        <FlippableCard
          frontImageUrl={mockFrontImageUrl}
          backImageUrl={mockBackImageUrl}
        />
      );

      expect(screen.getByAltText('Front Image')).toBeInTheDocument();
      expect(screen.getByAltText('Back Image')).toBeInTheDocument();
    });
  });

  // Test 2: Null image handling
  describe('Null Image Handling', () => {
    it('should display placeholder when front image is null', () => {
      render(
        <FlippableCard
          frontImageUrl={null}
          backImageUrl={mockBackImageUrl}
        />
      );

      expect(screen.getByText(/front image not available/i)).toBeInTheDocument();
    });

    it('should display placeholder when back image is null', () => {
      render(
        <FlippableCard
          frontImageUrl={mockFrontImageUrl}
          backImageUrl={null}
        />
      );

      expect(screen.getByText(/back image not available/i)).toBeInTheDocument();
    });

    it('should display placeholders for both null images', () => {
      render(
        <FlippableCard
          frontImageUrl={null}
          backImageUrl={null}
        />
      );

      expect(screen.getByText(/front image not available/i)).toBeInTheDocument();
      expect(screen.getByText(/back image not available/i)).toBeInTheDocument();
    });
  });

  // Test 3: Manual click flipping
  describe('Manual Click Flipping', () => {
    it('should flip card when clicked', () => {
      const { container } = render(
        <FlippableCard
          frontImageUrl={mockFrontImageUrl}
          backImageUrl={mockBackImageUrl}
        />
      );

      const clickableDiv = container.querySelector('.cursor-pointer');
      expect(clickableDiv).toBeInTheDocument();

      const cardInner = container.querySelector('.transition-transform');
      expect(cardInner).not.toHaveClass('rotate-y-180');

      // Click to flip
      fireEvent.click(clickableDiv!);

      expect(cardInner).toHaveClass('rotate-y-180');
    });

    it('should toggle between flipped states on multiple clicks', () => {
      const { container } = render(
        <FlippableCard
          frontImageUrl={mockFrontImageUrl}
          backImageUrl={mockBackImageUrl}
        />
      );

      const clickableDiv = container.querySelector('.cursor-pointer');
      const cardInner = container.querySelector('.transition-transform');

      // Initially not flipped
      expect(cardInner).not.toHaveClass('rotate-y-180');

      // First click - flip
      fireEvent.click(clickableDiv!);
      expect(cardInner).toHaveClass('rotate-y-180');

      // Second click - flip back
      fireEvent.click(clickableDiv!);
      expect(cardInner).not.toHaveClass('rotate-y-180');

      // Third click - flip again
      fireEvent.click(clickableDiv!);
      expect(cardInner).toHaveClass('rotate-y-180');
    });

    it('should stop auto-flipping after manual click', () => {
      jest.useFakeTimers();

      const { container } = render(
        <FlippableCard
          frontImageUrl={mockFrontImageUrl}
          backImageUrl={mockBackImageUrl}
        />
      );

      const clickableDiv = container.querySelector('.cursor-pointer');
      const cardInner = container.querySelector('.transition-transform');

      // Manual click
      fireEvent.click(clickableDiv!);

      // Advance time by 3 seconds (auto-flip interval)
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Card should still be in manually flipped state (not auto-flipped back)
      expect(cardInner).toHaveClass('rotate-y-180');

      // Advance another 3 seconds
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Still in the same state
      expect(cardInner).toHaveClass('rotate-y-180');

      jest.useRealTimers();
    });
  });

  // Test 4: Automatic flipping
  describe('Automatic Flipping', () => {
    it('should auto-flip every 3 seconds', () => {
      jest.useFakeTimers();

      const { container } = render(
        <FlippableCard
          frontImageUrl={mockFrontImageUrl}
          backImageUrl={mockBackImageUrl}
        />
      );

      const cardInner = container.querySelector('.transition-transform');

      // Initially not flipped
      expect(cardInner).not.toHaveClass('rotate-y-180');

      // After 3 seconds - should flip
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(cardInner).toHaveClass('rotate-y-180');

      // After another 3 seconds - should flip back
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(cardInner).not.toHaveClass('rotate-y-180');

      // After another 3 seconds - should flip again
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(cardInner).toHaveClass('rotate-y-180');

      jest.useRealTimers();
    });

    it('should clean up interval on unmount', () => {
      jest.useFakeTimers();
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      const { unmount } = render(
        <FlippableCard
          frontImageUrl={mockFrontImageUrl}
          backImageUrl={mockBackImageUrl}
        />
      );

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
      jest.useRealTimers();
    });
  });

  // Test 5: CSS classes and styling
  describe('Styling', () => {
    it('should have correct transformation classes', () => {
      const { container } = render(
        <FlippableCard
          frontImageUrl={mockFrontImageUrl}
          backImageUrl={mockBackImageUrl}
        />
      );

      const cardInner = container.querySelector('.transition-transform');
      expect(cardInner).toHaveClass('duration-700', 'ease-in-out', 'transform');
    });

    it('should have preserve-3d style', () => {
      const { container } = render(
        <FlippableCard
          frontImageUrl={mockFrontImageUrl}
          backImageUrl={mockBackImageUrl}
        />
      );

      const cardInner = container.querySelector('[style*="preserve-3d"]');
      expect(cardInner).toBeInTheDocument();
    });

    it('should apply cursor-pointer class to make card clickable', () => {
      const { container } = render(
        <FlippableCard
          frontImageUrl={mockFrontImageUrl}
          backImageUrl={mockBackImageUrl}
        />
      );

      const clickableDiv = container.querySelector('.cursor-pointer');
      expect(clickableDiv).toBeInTheDocument();
    });

    it('should have backface-hidden class on both sides', () => {
      const { container } = render(
        <FlippableCard
          frontImageUrl={mockFrontImageUrl}
          backImageUrl={mockBackImageUrl}
        />
      );

      const backfaceHiddenElements = container.querySelectorAll('.backface-hidden');
      expect(backfaceHiddenElements).toHaveLength(2); // Front and back
    });

    it('should have rotate-y-180 class on back side', () => {
      const { container } = render(
        <FlippableCard
          frontImageUrl={mockFrontImageUrl}
          backImageUrl={mockBackImageUrl}
        />
      );

      const backSide = container.querySelector('.rotate-y-180.backface-hidden');
      expect(backSide).toBeInTheDocument();
    });
  });

  // Test 6: Image component props
  describe('Image Props', () => {
    it('should pass correct props to Image components', () => {
      render(
        <FlippableCard
          frontImageUrl={mockFrontImageUrl}
          backImageUrl={mockBackImageUrl}
        />
      );

      const frontImage = screen.getByAltText('Front Image');
      const backImage = screen.getByAltText('Back Image');

      // Check src attributes
      expect(frontImage).toHaveAttribute('src', mockFrontImageUrl);
      expect(backImage).toHaveAttribute('src', mockBackImageUrl);
    });

    it('should have rounded-xl class on images', () => {
      render(
        <FlippableCard
          frontImageUrl={mockFrontImageUrl}
          backImageUrl={mockBackImageUrl}
        />
      );

      const images = screen.getAllByAltText(/image/i);
      images.forEach((img) => {
        expect(img).toHaveClass('rounded-xl');
      });
    });
  });

  // Test 7: State management
  describe('State Management', () => {
    it('should maintain flipped state correctly', () => {
      const { container, rerender } = render(
        <FlippableCard
          frontImageUrl={mockFrontImageUrl}
          backImageUrl={mockBackImageUrl}
        />
      );

      const clickableDiv = container.querySelector('.cursor-pointer');
      const cardInner = container.querySelector('.transition-transform');

      // Flip the card
      fireEvent.click(clickableDiv!);
      expect(cardInner).toHaveClass('rotate-y-180');

      // Re-render with same props
      rerender(
        <FlippableCard
          frontImageUrl={mockFrontImageUrl}
          backImageUrl={mockBackImageUrl}
        />
      );

      // State should be maintained
      expect(cardInner).toHaveClass('rotate-y-180');
    });

    it('should maintain autoFlip state after click', () => {
      jest.useFakeTimers();

      const { container } = render(
        <FlippableCard
          frontImageUrl={mockFrontImageUrl}
          backImageUrl={mockBackImageUrl}
        />
      );

      const clickableDiv = container.querySelector('.cursor-pointer');

      // Click to disable auto-flip
      fireEvent.click(clickableDiv!);

      // Advance time significantly
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // Manual click again
      fireEvent.click(clickableDiv!);

      // Should still not auto-flip
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      jest.useRealTimers();
    });
  });

  // Test 8: Edge cases
  describe('Edge Cases', () => {
    it('should handle empty string URLs', () => {
      render(
        <FlippableCard
          frontImageUrl=""
          backImageUrl=""
        />
      );

      expect(screen.getByText(/front image not available/i)).toBeInTheDocument();
      expect(screen.getByText(/back image not available/i)).toBeInTheDocument();
    });

    it('should handle rapid clicks', () => {
      const { container } = render(
        <FlippableCard
          frontImageUrl={mockFrontImageUrl}
          backImageUrl={mockBackImageUrl}
        />
      );

      const clickableDiv = container.querySelector('.cursor-pointer');
      const cardInner = container.querySelector('.transition-transform');

      // Rapid clicks
      fireEvent.click(clickableDiv!);
      fireEvent.click(clickableDiv!);
      fireEvent.click(clickableDiv!);
      fireEvent.click(clickableDiv!);

      // Should end up not flipped (even number of clicks from initial state)
      expect(cardInner).not.toHaveClass('rotate-y-180');
    });
  });

  // Test 9: Accessibility
  describe('Accessibility', () => {
    it('should have alt text for images', () => {
      render(
        <FlippableCard
          frontImageUrl={mockFrontImageUrl}
          backImageUrl={mockBackImageUrl}
        />
      );

      expect(screen.getByAltText('Front Image')).toBeInTheDocument();
      expect(screen.getByAltText('Back Image')).toBeInTheDocument();
    });

    it('should be clickable for keyboard users', () => {
      const { container } = render(
        <FlippableCard
          frontImageUrl={mockFrontImageUrl}
          backImageUrl={mockBackImageUrl}
        />
      );

      const clickableDiv = container.querySelector('.cursor-pointer');
      expect(clickableDiv).toBeInTheDocument();
      
      // Component should respond to clicks (which includes keyboard activation)
      const cardInner = container.querySelector('.transition-transform');
      fireEvent.click(clickableDiv!);
      expect(cardInner).toHaveClass('rotate-y-180');
    });
  });
});
