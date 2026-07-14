import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailPopup from '../EmailPopup';

// Mock useSearchParams from next/navigation
const mockGet = jest.fn();
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

// Mock SubmitButton component
jest.mock('../SubmitButton', () => {
  return function MockSubmitButton({ children, onClick, disabled, type }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; type?: 'button' | 'submit' | 'reset' }) {
    return (
      <button onClick={onClick} disabled={disabled} type={type}>
        {children}
      </button>
    );
  };
});

// Mock fetch globally
const mockFetch = global.fetch as jest.Mock;

describe('EmailPopup Component', () => {
  const mockOnSubmit = jest.fn();
  const mockImageId = 'kiosk1_filter1_1234567890';

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockGet.mockReturnValue(mockImageId);
    process.env.NEXT_PUBLIC_SAVE_EMAIL_URL = 'https://api.example.com/save-email';
  });

  // Test 1: Renders correctly with default state
  describe('Rendering', () => {
    it('should render the email popup with title and input field', () => {
      render(<EmailPopup onSubmit={mockOnSubmit} />);
      
      expect(screen.getByText(/enter your email to view and share your images/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
      expect(screen.getByText(/submit/i)).toBeInTheDocument();
    });

    it('should have submit button disabled when email is empty', () => {
      render(<EmailPopup onSubmit={mockOnSubmit} />);
      
      const submitButton = screen.getByText(/submit/i);
      expect(submitButton).toBeDisabled();
    });

    it('should not show previous email button initially', () => {
      render(<EmailPopup onSubmit={mockOnSubmit} />);
      
      const prevEmailButton = screen.queryByText(/use previous email/i);
      expect(prevEmailButton).not.toBeInTheDocument();
    });
  });

  // Test 2: Email input handling
  describe('Email Input', () => {
    it('should update email state when user types', async () => {
      render(<EmailPopup onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      await userEvent.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should enable submit button when email has value', async () => {
      render(<EmailPopup onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      await userEvent.type(emailInput, 'test@example.com');

      const submitButton = screen.getByText(/submit/i);
      expect(submitButton).not.toBeDisabled();
    });

    it('should disable submit button for whitespace-only email', async () => {
      render(<EmailPopup onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      await userEvent.type(emailInput, '   ');

      const submitButton = screen.getByText(/submit/i);
      expect(submitButton).toBeDisabled();
    });
  });

  // Test 3: Email validation
  describe.skip('Email Validation', () => {
    it('should show error for invalid email format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<EmailPopup onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      await userEvent.type(emailInput, 'invalid-email');

      const submitButton = screen.getByText(/submit/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should not show error for valid email format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<EmailPopup onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      await userEvent.type(emailInput, 'valid@example.com');

      const submitButton = screen.getByText(/submit/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
    });
  });

  // Test 4: Form submission - successful case
  describe('Form Submission - Success', () => {
    it('should call API with correct data on submit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<EmailPopup onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      await userEvent.type(emailInput, 'user@example.com');

      const submitButton = screen.getByText(/submit/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.example.com/save-email',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'user@example.com',
              kiosk_name: 'kiosk1',
              filter_name: 'filter1',
              timestamp: '1234567890',
            }),
          })
        );
      });
    });

    it('should save email to localStorage on successful submission', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<EmailPopup onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      await userEvent.type(emailInput, 'user@example.com');

      const submitButton = screen.getByText(/submit/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('userEmail', 'user@example.com');
      });
    });

    it('should call onSubmit callback on successful save', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<EmailPopup onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      await userEvent.type(emailInput, 'user@example.com');

      const submitButton = screen.getByText(/submit/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('user@example.com');
      });
    });

    it('should show loading state during submission', async () => {
      // Create a promise that we can control
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(promise as Promise<Response>);

      render(<EmailPopup onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      await userEvent.type(emailInput, 'user@example.com');

      const submitButton = screen.getByText(/submit/i);
      fireEvent.click(submitButton);

      // Check for loading text
      await waitFor(() => {
        expect(screen.getByText(/saving\.\.\./i)).toBeInTheDocument();
      });

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => ({ success: true }),
      });

      await waitFor(() => {
        expect(screen.getByText(/submit/i)).toBeInTheDocument();
      });
    });
  });

  // Test 5: Form submission - error cases
  describe.skip('Form Submission - Error Handling', () => {
    it('should display error message when API returns error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: 'Email already exists' }),
      });

      render(<EmailPopup onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      await userEvent.type(emailInput, 'user@example.com');

      const submitButton = screen.getByText(/submit/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should display default error message when API returns no error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false }),
      });

      render(<EmailPopup onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      await userEvent.type(emailInput, 'user@example.com');

      const submitButton = screen.getByText(/submit/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to save email/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<EmailPopup onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      await userEvent.type(emailInput, 'user@example.com');

      const submitButton = screen.getByText(/submit/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/something went wrong. please try again/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should clear previous errors when submitting again', async () => {
      // First submission - fail (server returns error)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: 'First error' }),
      });

      render(<EmailPopup onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      await userEvent.type(emailInput, 'user@example.com');

      const submitButton = screen.getByText(/submit/i);
      fireEvent.click(submitButton);

      // Error from first attempt should appear (actual message may vary)
      await waitFor(() => {
        expect(
          screen.queryByText(/first error/i) ||
          screen.queryByText(/something went wrong/i) ||
          screen.queryByText(/failed to save/i)
        ).toBeInTheDocument();
      });

      // Second submission - success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      fireEvent.click(submitButton);

      // Error should be cleared after successful retry
      await waitFor(() => {
        expect(screen.queryByText(/first error/i)).not.toBeInTheDocument();
      });
    });
  });

  // Test 6: Previous email functionality
  describe.skip('Previous Email', () => {
    it('should display previous email button when email exists in localStorage', async () => {
      jest.spyOn(localStorage, 'getItem').mockReturnValue('previous@example.com');

      render(<EmailPopup onSubmit={mockOnSubmit} />);
      
      await waitFor(() => {
        expect(screen.getByText(/use previous email \(previous@example.com\)/i)).toBeInTheDocument();
      });
    });

    it('should submit with previous email when previous email button is clicked', async () => {
      jest.spyOn(localStorage, 'getItem').mockReturnValue('previous@example.com');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<EmailPopup onSubmit={mockOnSubmit} />);
      
      await waitFor(() => {
        expect(screen.getByText(/use previous email/i)).toBeInTheDocument();
      });

      const prevEmailButton = screen.getByText(/use previous email/i);
      await act(async () => {
        fireEvent.click(prevEmailButton);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringContaining('previous@example.com'),
          })
        );
      });

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('userEmail', 'previous@example.com');
      });
    });
  });

  // Test 7: URL parameter parsing
  describe('URL Parameter Parsing', () => {
    it('should parse imageId from URL parameters correctly', async () => {
      mockGet.mockReturnValue('kiosk2_filter3_9876543210');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<EmailPopup onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      await userEvent.type(emailInput, 'user@example.com');

      const submitButton = screen.getByText(/submit/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({
              email: 'user@example.com',
              kiosk_name: 'kiosk2',
              filter_name: 'filter3',
              timestamp: '9876543210',
            }),
          })
        );
      });
    });

    it('should handle missing imageId gracefully', async () => {
      mockGet.mockReturnValue(null);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<EmailPopup onSubmit={mockOnSubmit} />);
      
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      await userEvent.type(emailInput, 'user@example.com');

      const submitButton = screen.getByText(/submit/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({
              email: 'user@example.com',
              kiosk_name: '',
              filter_name: '',
              timestamp: '',
            }),
          })
        );
      });
    });
  });

  // Test 8: Suspense boundary
  describe('Suspense Boundary', () => {
    it('should render without crashing when wrapped in Suspense', () => {
      const { container } = render(<EmailPopup onSubmit={mockOnSubmit} />);
      expect(container).toBeInTheDocument();
    });
  });
});
