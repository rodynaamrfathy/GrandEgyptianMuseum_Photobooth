import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import LoopingText from '../LoopingText';

describe('LoopingText Component', () => {
  const mockTexts = ['First text', 'Second text', 'Third text'];

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // Test 1: Renders correctly with initial text
  describe('Rendering', () => {
    it('should render the first text initially', () => {
      render(<LoopingText texts={mockTexts} />);
      
      expect(screen.getByText('First text')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(
        <LoopingText texts={mockTexts} className="custom-class" />
      );
      
      const textContainer = container.querySelector('.custom-class');
      expect(textContainer).toBeInTheDocument();
    });

    it('should have default styling classes', () => {
      const { container } = render(<LoopingText texts={mockTexts} />);
      
      const textContainer = container.querySelector('.text-center');
      expect(textContainer).toBeInTheDocument();
      expect(textContainer).toHaveClass('flex', 'justify-center', 'items-center');
    });
  });

  // Test 2: Text cycling functionality
  describe('Text Cycling', () => {
    it('should cycle through texts at the specified interval', async () => {
      render(<LoopingText texts={mockTexts} interval={2500} />);
      
      // Initially shows first text
      expect(screen.getByText('First text')).toBeInTheDocument();
      
      // After fade out (300ms) + interval (2500ms)
      act(() => {
        jest.advanceTimersByTime(2800);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Second text')).toBeInTheDocument();
      });
      
      // After another cycle
      act(() => {
        jest.advanceTimersByTime(2500);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Third text')).toBeInTheDocument();
      });
    });

    it('should loop back to first text after reaching the end', async () => {
      render(<LoopingText texts={mockTexts} interval={1000} />);
      
      // Initially shows first text
      expect(screen.getByText('First text')).toBeInTheDocument();
      
      // Cycle through all texts
      act(() => {
        jest.advanceTimersByTime(1300); // To second
      });
      
      act(() => {
        jest.advanceTimersByTime(1000); // To third
      });
      
      act(() => {
        jest.advanceTimersByTime(1000); // Back to first
      });
      
      await waitFor(() => {
        expect(screen.getByText('First text')).toBeInTheDocument();
      });
    });

    it('should use custom interval when provided', async () => {
      render(<LoopingText texts={mockTexts} interval={5000} />);
      
      expect(screen.getByText('First text')).toBeInTheDocument();
      
      // Text should NOT change before 5 seconds
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(screen.getByText('First text')).toBeInTheDocument();
      
      // Text should change after 5 seconds (+ fade time)
      act(() => {
        jest.advanceTimersByTime(2300);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Second text')).toBeInTheDocument();
      });
    });

    it('should use default interval (2500ms) when not provided', async () => {
      render(<LoopingText texts={mockTexts} />);
      
      expect(screen.getByText('First text')).toBeInTheDocument();
      
      act(() => {
        jest.advanceTimersByTime(2800);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Second text')).toBeInTheDocument();
      });
    });
  });

  // Test 3: Fade animation
  describe('Fade Animation', () => {
    it('should have fade in class initially', () => {
      const { container } = render(<LoopingText texts={mockTexts} />);
      
      const visibleText = container.querySelector('.opacity-100');
      expect(visibleText).toBeInTheDocument();
    });

    it('should apply transition classes', () => {
      const { container } = render(<LoopingText texts={mockTexts} />);
      
      const visibleText = container.querySelector('.transition-all');
      expect(visibleText).toBeInTheDocument();
      expect(visibleText).toHaveClass('duration-300', 'ease-in-out');
    });

    it('should have translate animation classes', () => {
      const { container } = render(<LoopingText texts={mockTexts} />);
      
      const visibleText = container.querySelector('.translate-y-0');
      expect(visibleText).toBeInTheDocument();
    });
  });

  // Test 4: Reference text for width calculation
  describe('Width Calculation', () => {
    it('should render invisible reference text for longest word', () => {
      const textsWithVaryingLengths = ['Short', 'Medium text', 'This is the longest text here'];
      const { container } = render(<LoopingText texts={textsWithVaryingLengths} />);
      
      const invisibleText = container.querySelector('.invisible');
      expect(invisibleText).toBeInTheDocument();
      expect(invisibleText).toHaveTextContent('This is the longest text here');
    });

    it('should determine longest text correctly', () => {
      const texts = ['A', 'BB', 'CCC', 'DD'];
      const { container } = render(<LoopingText texts={texts} />);
      
      const invisibleText = container.querySelector('.invisible');
      expect(invisibleText).toHaveTextContent('CCC');
    });
  });

  // Test 5: Responsive text sizing
  describe('Responsive Sizing', () => {
    it('should have responsive text size classes', () => {
      const { container } = render(<LoopingText texts={mockTexts} />);
      
      const visibleText = container.querySelector('.absolute');
      const classes = visibleText?.className || '';
      
      // Check for responsive text sizing
      expect(classes).toMatch(/text-/);
    });

    it('should have break-words class for text wrapping', () => {
      const { container } = render(<LoopingText texts={mockTexts} />);
      
      const visibleText = container.querySelector('.absolute');
      expect(visibleText).toHaveClass('break-words');
    });
  });

  // Test 6: Custom styling
  describe('Custom Styling', () => {
    it('should apply white text color', () => {
      const { container } = render(<LoopingText texts={mockTexts} />);
      
      const visibleText = container.querySelector('.absolute');
      expect(visibleText).toHaveStyle({ color: '#FFFFFF' });
    });

    it('should apply text shadow', () => {
      const { container } = render(<LoopingText texts={mockTexts} />);
      
      const visibleText = container.querySelector('.absolute');
      expect(visibleText).toHaveStyle({ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' });
    });

    it('should have font-semibold class', () => {
      const { container } = render(<LoopingText texts={mockTexts} />);
      
      const visibleText = container.querySelector('.absolute');
      expect(visibleText).toHaveClass('font-semibold');
    });
  });

  // Test 7: Timer cleanup
  describe('Timer Cleanup', () => {
    it('should clear interval on unmount', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      const { unmount } = render(<LoopingText texts={mockTexts} />);
      unmount();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });

    it('should restart timer when interval prop changes', () => {
      const { rerender } = render(<LoopingText texts={mockTexts} interval={1000} />);
      
      expect(screen.getByText('First text')).toBeInTheDocument();
      
      // Change interval
      rerender(<LoopingText texts={mockTexts} interval={3000} />);
      
      // Should still work with new interval
      act(() => {
        jest.advanceTimersByTime(3300);
      });
      
      expect(screen.getByText('Second text')).toBeInTheDocument();
    });

    it('should restart timer when texts array changes', () => {
      const { rerender } = render(<LoopingText texts={mockTexts} />);
      
      expect(screen.getByText('First text')).toBeInTheDocument();
      
      // Change texts array
      const newTexts = ['New first', 'New second'];
      rerender(<LoopingText texts={newTexts} />);
      
      act(() => {
        jest.advanceTimersByTime(2800);
      });
      
      expect(screen.getByText('New second')).toBeInTheDocument();
    });
  });

  // Test 8: Edge cases
  describe('Edge Cases', () => {
    it('should handle single text without cycling', () => {
      render(<LoopingText texts={['Only text']} />);
      
      expect(screen.getByText('Only text')).toBeInTheDocument();
      
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      // Should still show the same text
      expect(screen.getByText('Only text')).toBeInTheDocument();
    });

    it('should handle two texts and cycle between them', async () => {
      const twoTexts = ['Text A', 'Text B'];
      render(<LoopingText texts={twoTexts} interval={1000} />);
      
      expect(screen.getByText('Text A')).toBeInTheDocument();
      
      act(() => {
        jest.advanceTimersByTime(1300);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Text B')).toBeInTheDocument();
      });
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Text A')).toBeInTheDocument();
      });
    });
  });

  // Test 9: Container layout
  describe('Container Layout', () => {
    it('should have relative positioning', () => {
      const { container } = render(<LoopingText texts={mockTexts} />);
      
      const outerContainer = container.querySelector('.relative');
      expect(outerContainer).toBeInTheDocument();
    });

    it('should have flex layout', () => {
      const { container } = render(<LoopingText texts={mockTexts} />);
      
      const outerContainer = container.querySelector('.flex');
      expect(outerContainer).toBeInTheDocument();
    });

    it('should have full width classes', () => {
      const { container } = render(<LoopingText texts={mockTexts} />);
      
      const outerContainer = container.querySelector('.w-full');
      expect(outerContainer).toBeInTheDocument();
      expect(outerContainer).toHaveClass('max-w-full');
    });

    it('should have padding class', () => {
      const { container } = render(<LoopingText texts={mockTexts} />);
      
      const outerContainer = container.querySelector('.px-2');
      expect(outerContainer).toBeInTheDocument();
    });
  });
});
