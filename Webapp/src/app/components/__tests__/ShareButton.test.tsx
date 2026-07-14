import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ShareButton from '../ShareButton';

// Mock lucide-react Share2 icon
jest.mock('lucide-react', () => ({
  Share2: ({ className }: { className: string }) => (
    <svg data-testid="share2-icon" className={className} />
  ),
}));

describe('ShareButton Component', () => {
  const mockImageUrl = 'https://example.com/image.jpg';
  const mockCardBlob = new Blob(['card data'], { type: 'image/png' });
  
  // Mock fetch for image download
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        blob: () => Promise.resolve(new Blob(['image data'], { type: 'image/jpeg' })),
      })
    ) as jest.Mock;

    // Mock navigator.canShare and navigator.share
    Object.defineProperty(navigator, 'canShare', {
      writable: true,
      value: jest.fn(),
    });
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: jest.fn(),
    });

    // Mock window.open
    global.window.open = jest.fn();

    // Mock alert
    global.alert = jest.fn();

    // Mock console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  // Test 1: Renders correctly with default props
  describe('Rendering', () => {
    it('should render the share button', () => {
      render(
        <ShareButton
          imageUrl={mockImageUrl}
          cardBlob={mockCardBlob}
        />
      );
      
      const shareButton = screen.getByRole('button', { name: /share/i });
      expect(shareButton).toBeInTheDocument();
    });

    it('should display share icon', () => {
      render(
        <ShareButton
          imageUrl={mockImageUrl}
          cardBlob={mockCardBlob}
        />
      );
      
      expect(screen.getByTestId('share2-icon')).toBeInTheDocument();
    });

    it('should display share button text from translation', () => {
      render(
        <ShareButton
          imageUrl={mockImageUrl}
          cardBlob={mockCardBlob}
        />
      );
      
      expect(screen.getByText(/share\.button/i)).toBeInTheDocument();
    });

    it('should apply custom className when provided', () => {
      render(
        <ShareButton
          imageUrl={mockImageUrl}
          cardBlob={mockCardBlob}
          className="custom-class"
        />
      );
      
      const shareButton = screen.getByRole('button');
      expect(shareButton).toHaveClass('custom-class');
    });

    it('should have correct default styling classes', () => {
      render(
        <ShareButton
          imageUrl={mockImageUrl}
          cardBlob={mockCardBlob}
        />
      );
      
      const shareButton = screen.getByRole('button');
      expect(shareButton).toHaveClass(
        'rounded-2xl',
        'backdrop-blur',
        'bg-white/10',
        'border',
        'border-white/20'
      );
    });
  });

  // Test 2: Native Web Share API - successful share
  describe('Web Share API - Success', () => {
    it('should use Web Share API when available and canShare returns true', async () => {
      const mockCanShare = jest.fn().mockReturnValue(true);
      const mockShare = jest.fn().mockResolvedValue(undefined);
      
      (navigator.canShare as jest.Mock) = mockCanShare;
      (navigator.share as jest.Mock) = mockShare;

      render(
        <ShareButton
          imageUrl={mockImageUrl}
          cardBlob={mockCardBlob}
        />
      );
      
      const shareButton = screen.getByRole('button');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(mockImageUrl);
        expect(mockShare).toHaveBeenCalled();
      });
    });

    it('should create File objects with correct names and types', async () => {
      const mockCanShare = jest.fn().mockReturnValue(true);
      const mockShare = jest.fn().mockResolvedValue(undefined);
      
      (navigator.canShare as jest.Mock) = mockCanShare;
      (navigator.share as jest.Mock) = mockShare;

      render(
        <ShareButton
          imageUrl={mockImageUrl}
          cardBlob={mockCardBlob}
        />
      );
      
      const shareButton = screen.getByRole('button');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(mockShare).toHaveBeenCalledWith(
          expect.objectContaining({
            files: expect.arrayContaining([
              expect.any(File),
              expect.any(File),
            ]),
          })
        );
      });
    });

    it('should include title and text in share data', async () => {
      const mockCanShare = jest.fn().mockReturnValue(true);
      const mockShare = jest.fn().mockResolvedValue(undefined);
      
      (navigator.canShare as jest.Mock) = mockCanShare;
      (navigator.share as jest.Mock) = mockShare;

      render(
        <ShareButton
          imageUrl={mockImageUrl}
          cardBlob={mockCardBlob}
        />
      );
      
      const shareButton = screen.getByRole('button');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(mockShare).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.any(String),
            text: expect.any(String),
          })
        );
      });
    });
  });

  // Test 3: Fallback mechanism when Web Share API is not available
  describe('Fallback Mechanism', () => {
    it('should use fallback when canShare returns false', async () => {
      const mockCanShare = jest.fn().mockReturnValue(false);
      
      (navigator.canShare as jest.Mock) = mockCanShare;

      render(
        <ShareButton
          imageUrl={mockImageUrl}
          cardBlob={mockCardBlob}
        />
      );
      
      const shareButton = screen.getByRole('button');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(window.open).toHaveBeenCalledTimes(2);
      });
    });

    it('should use fallback when canShare is not supported', async () => {
      delete (navigator as { canShare?: unknown }).canShare;

      render(
        <ShareButton
          imageUrl={mockImageUrl}
          cardBlob={mockCardBlob}
        />
      );
      
      const shareButton = screen.getByRole('button');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(window.open).toHaveBeenCalled();
      });
    });

    it('should open both card and image in new windows', async () => {
      const mockCanShare = jest.fn().mockReturnValue(false);
      (navigator.canShare as jest.Mock) = mockCanShare;

      render(
        <ShareButton
          imageUrl={mockImageUrl}
          cardBlob={mockCardBlob}
        />
      );
      
      const shareButton = screen.getByRole('button');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(window.open).toHaveBeenCalledWith(expect.any(String), '_blank');
        expect(window.open).toHaveBeenCalledTimes(2);
      });
    });

    it('should revoke object URLs after opening', async () => {
      jest.useFakeTimers();
      const mockCanShare = jest.fn().mockReturnValue(false);
      (navigator.canShare as jest.Mock) = mockCanShare;

      const revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL');

      render(
        <ShareButton
          imageUrl={mockImageUrl}
          cardBlob={mockCardBlob}
        />
      );
      
      const shareButton = screen.getByRole('button');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(window.open).toHaveBeenCalled();
      });

      // Fast-forward time by 2 seconds
      jest.advanceTimersByTime(2000);

      expect(revokeObjectURLSpy).toHaveBeenCalledTimes(2);

      revokeObjectURLSpy.mockRestore();
      jest.useRealTimers();
    });
  });

  // Test 4: Error handling
  describe('Error Handling', () => {
    it('should handle fetch error gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(
        <ShareButton
          imageUrl={mockImageUrl}
          cardBlob={mockCardBlob}
        />
      );
      
      const shareButton = screen.getByRole('button');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('Error sharing'),
          expect.any(Error)
        );
      });

      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('share.error'));
    });

    it('should handle share API rejection', async () => {
      const mockCanShare = jest.fn().mockReturnValue(true);
      const mockShare = jest.fn().mockRejectedValue(new Error('Share failed'));
      
      (navigator.canShare as jest.Mock) = mockCanShare;
      (navigator.share as jest.Mock) = mockShare;

      render(
        <ShareButton
          imageUrl={mockImageUrl}
          cardBlob={mockCardBlob}
        />
      );
      
      const shareButton = screen.getByRole('button');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });

    it('should display error alert when sharing fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Fetch failed'));

      render(
        <ShareButton
          imageUrl={mockImageUrl}
          cardBlob={mockCardBlob}
        />
      );
      
      const shareButton = screen.getByRole('button');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled();
      });
    });
  });

  // Test 5: File creation
  describe('File Creation', () => {
    it('should create card file with correct name and type', async () => {
      const mockCanShare = jest.fn().mockReturnValue(true);
      const mockShare = jest.fn((data: ShareData) => {
        const files = data.files as File[];
        const cardFile = files.find(f => f.name === 'memory_card.png');
        
        expect(cardFile).toBeDefined();
        expect(cardFile?.type).toBe('image/png');
        
        return Promise.resolve();
      });
      
      (navigator.canShare as jest.Mock) = mockCanShare;
      (navigator.share as jest.Mock) = mockShare;

      render(
        <ShareButton
          imageUrl={mockImageUrl}
          cardBlob={mockCardBlob}
        />
      );
      
      const shareButton = screen.getByRole('button');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(mockShare).toHaveBeenCalled();
      });
    });

    it('should create image file with correct name', async () => {
      const mockCanShare = jest.fn().mockReturnValue(true);
      const mockShare = jest.fn((data: ShareData) => {
        const files = data.files as File[];
        const imageFile = files.find(f => f.name === 'image.jpg');
        
        expect(imageFile).toBeDefined();
        
        return Promise.resolve();
      });
      
      (navigator.canShare as jest.Mock) = mockCanShare;
      (navigator.share as jest.Mock) = mockShare;

      render(
        <ShareButton
          imageUrl={mockImageUrl}
          cardBlob={mockCardBlob}
        />
      );
      
      const shareButton = screen.getByRole('button');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(mockShare).toHaveBeenCalled();
      });
    });
  });

  // Test 6: Button accessibility
  describe('Accessibility', () => {
    it('should have aria-label attribute', () => {
      render(
        <ShareButton
          imageUrl={mockImageUrl}
          cardBlob={mockCardBlob}
        />
      );
      
      const shareButton = screen.getByRole('button');
      expect(shareButton).toHaveAttribute('aria-label');
    });

    it('should be keyboard accessible', () => {
      render(
        <ShareButton
          imageUrl={mockImageUrl}
          cardBlob={mockCardBlob}
        />
      );
      
      const shareButton = screen.getByRole('button');
      expect(shareButton).not.toBeDisabled();
      shareButton.focus();
      expect(shareButton).toHaveFocus();
    });
  });

  // Test 7: Styling and hover effects
  describe('Styling', () => {
    it('should have hover effect classes', () => {
      render(
        <ShareButton
          imageUrl={mockImageUrl}
          cardBlob={mockCardBlob}
        />
      );
      
      const shareButton = screen.getByRole('button');
      expect(shareButton).toHaveClass('hover:shadow-xl', 'transition-all', 'duration-300');
    });

    it('should have flex layout for icon and text', () => {
      render(
        <ShareButton
          imageUrl={mockImageUrl}
          cardBlob={mockCardBlob}
        />
      );
      
      const shareButton = screen.getByRole('button');
      expect(shareButton).toHaveClass('flex', 'items-center', 'justify-center', 'space-x-3');
    });

    it('should display icon with correct styling', () => {
      render(
        <ShareButton
          imageUrl={mockImageUrl}
          cardBlob={mockCardBlob}
        />
      );
      
      const icon = screen.getByTestId('share2-icon');
      expect(icon).toHaveClass('w-5', 'h-5', 'text-white');
    });
  });
});
