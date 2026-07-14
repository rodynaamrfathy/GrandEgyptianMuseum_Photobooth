import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GetImageByEmail from '../GetImageByEmail';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Mail: ({ className }: { className: string }) => (
    <svg data-testid="mail-icon" className={className} />
  ),
  Loader2: ({ className }: { className: string }) => (
    <svg data-testid="loader-icon" className={className} />
  ),
}));

// Mock useSearchParams from next/navigation
const mockGet = jest.fn();
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

// Mock fetch globally
const mockFetch = global.fetch as jest.Mock;

describe('GetImageByEmail Component (EmailButton)', () => {
  const mockCardBlob = new Blob(['card data'], { type: 'image/png' });
  const mockUserEmail = 'test@example.com';
  const mockImageId = 'kiosk1_filter1_1234567890';

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue(mockImageId);
    process.env.NEXT_PUBLIC_SEND_IMAGE_EMAIL_URL = 'https://api.example.com/send-email';
    global.alert = jest.fn();
  });

  // Test 1: Renders correctly with default state
  describe('Rendering', () => {
    it('should render email button with user email', () => {
      render(
        <GetImageByEmail
          cardBlob={mockCardBlob}
          userEmail={mockUserEmail}
        />
      );
      
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText(/share\.emailWith/i)).toBeInTheDocument();
    });

    it('should display mail icon when not sending', () => {
      render(
        <GetImageByEmail
          cardBlob={mockCardBlob}
          userEmail={mockUserEmail}
        />
      );
      
      expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('loader-icon')).not.toBeInTheDocument();
    });

    it('should display user email in button text', () => {
      render(
        <GetImageByEmail
          cardBlob={mockCardBlob}
          userEmail={mockUserEmail}
        />
      );
      
      // The translation key includes the email
      expect(screen.getByText(/share\.emailWith/i)).toBeInTheDocument();
    });

    it('should apply custom className when provided', () => {
      render(
        <GetImageByEmail
          cardBlob={mockCardBlob}
          userEmail={mockUserEmail}
          className="custom-class"
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should have default styling classes', () => {
      render(
        <GetImageByEmail
          cardBlob={mockCardBlob}
          userEmail={mockUserEmail}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'rounded-2xl',
        'backdrop-blur',
        'bg-white/10',
        'border',
        'border-white/20'
      );
    });
  });

  // Test 2: Email validation before sending
  describe('Email Validation', () => {
    it('should show alert when email is not provided', async () => {
      render(
        <GetImageByEmail
          cardBlob={mockCardBlob}
          userEmail=""
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('alerts.noEmail'));
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should not send email when userEmail is empty string', async () => {
      render(
        <GetImageByEmail
          cardBlob={mockCardBlob}
          userEmail=""
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // Test 3: Successful email sending
  describe('Email Sending - Success', () => {
    it('should convert blob to base64 and send email', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      render(
        <GetImageByEmail
          cardBlob={mockCardBlob}
          userEmail={mockUserEmail}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.example.com/send-email',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining(mockUserEmail),
          })
        );
      });
    });

    it('should include imageId in request body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      render(
        <GetImageByEmail
          cardBlob={mockCardBlob}
          userEmail={mockUserEmail}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringContaining(mockImageId),
          })
        );
      });
    });

    it('should include cardBase64 and cardName in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      render(
        <GetImageByEmail
          cardBlob={mockCardBlob}
          userEmail={mockUserEmail}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const fetchCall = mockFetch.mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        
        expect(body.cardBase64).toBeDefined();
        expect(body.cardName).toBe('GEM_Custom_Card.png');
      });
    });

    it('should show success alert on successful send', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      render(
        <GetImageByEmail
          cardBlob={mockCardBlob}
          userEmail={mockUserEmail}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          expect.stringContaining('alerts.saveSuccess')
        );
      });
    });
  });

  // Test 4: Loading state during sending
  describe('Loading State', () => {
    it('should show loading spinner when sending', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(promise as Promise<Response>);

      render(
        <GetImageByEmail
          cardBlob={mockCardBlob}
          userEmail={mockUserEmail}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('mail-icon')).not.toBeInTheDocument();

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => ({}),
      });

      await waitFor(() => {
        expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
      });
    });

    it('should display sending text when loading', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(promise as Promise<Response>);

      render(
        <GetImageByEmail
          cardBlob={mockCardBlob}
          userEmail={mockUserEmail}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/share\.sending/i)).toBeInTheDocument();
      });

      resolvePromise!({
        ok: true,
        json: async () => ({}),
      });
    });

    it('should disable button while sending', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(promise as Promise<Response>);

      render(
        <GetImageByEmail
          cardBlob={mockCardBlob}
          userEmail={mockUserEmail}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });

      resolvePromise!({
        ok: true,
        json: async () => ({}),
      });

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should have disabled styling when sending', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(promise as Promise<Response>);

      render(
        <GetImageByEmail
          cardBlob={mockCardBlob}
          userEmail={mockUserEmail}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
      });

      resolvePromise!({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  // Test 5: Error handling
  describe('Error Handling', () => {
    it('should handle API error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      render(
        <GetImageByEmail
          cardBlob={mockCardBlob}
          userEmail={mockUserEmail}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          expect.stringContaining('alerts.prepareError')
        );
      });
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <GetImageByEmail
          cardBlob={mockCardBlob}
          userEmail={mockUserEmail}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          expect.stringContaining('alerts.prepareError')
        );
      });
    });

    it('should log error to console', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetch.mockRejectedValueOnce(new Error('Test error'));

      render(
        <GetImageByEmail
          cardBlob={mockCardBlob}
          userEmail={mockUserEmail}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error sending email:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should re-enable button after error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Error'));

      render(
        <GetImageByEmail
          cardBlob={mockCardBlob}
          userEmail={mockUserEmail}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled();
      });

      expect(button).not.toBeDisabled();
    });
  });

  // Test 6: Blob to Base64 conversion
  describe('Blob Conversion', () => {
    it('should convert blob to base64 string', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      render(
        <GetImageByEmail
          cardBlob={mockCardBlob}
          userEmail={mockUserEmail}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const fetchCall = mockFetch.mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        
        // Base64 should not include data:image prefix
        expect(body.cardBase64).toBeDefined();
        expect(body.cardBase64).not.toContain('data:');
      });
    });
  });

  // Test 7: Multiple clicks handling
  describe('Multiple Clicks', () => {
    it('should prevent multiple simultaneous requests', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(promise as Promise<Response>);

      render(
        <GetImageByEmail
          cardBlob={mockCardBlob}
          userEmail={mockUserEmail}
        />
      );
      
      const button = screen.getByRole('button');
      
      // Click multiple times rapidly
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      // Should only call fetch once
      expect(mockFetch).toHaveBeenCalledTimes(1);

      resolvePromise!({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  // Test 8: Icon rendering
  describe('Icon Rendering', () => {
    it('should render mail icon with correct styling', () => {
      render(
        <GetImageByEmail
          cardBlob={mockCardBlob}
          userEmail={mockUserEmail}
        />
      );
      
      const icon = screen.getByTestId('mail-icon');
      expect(icon).toHaveClass('w-5', 'h-5', 'text-white');
    });

    it('should render loader icon with correct styling when loading', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(promise as Promise<Response>);

      render(
        <GetImageByEmail
          cardBlob={mockCardBlob}
          userEmail={mockUserEmail}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const loader = screen.getByTestId('loader-icon');
        expect(loader).toHaveClass('w-5', 'h-5', 'text-white', 'animate-spin');
      });

      resolvePromise!({
        ok: true,
        json: async () => ({}),
      });
    });
  });
});
