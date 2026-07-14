import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditButton from '../EditButton';

// Mock SubmitButton component
jest.mock('../SubmitButton', () => {
  return function MockSubmitButton({ children, onClick, disabled, className }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; className?: string }) {
    return (
      <button onClick={onClick} disabled={disabled} className={className}>
        {children}
      </button>
    );
  };
});

describe('EditButton Component', () => {
  // Test 1: Renders correctly with default props
  describe('Rendering', () => {
    it('should render the edit button with correct text', () => {
      render(<EditButton textToEdit="Sample text" />);
      
      const editButton = screen.getByRole('button', { name: /edit.button/i });
      expect(editButton).toBeInTheDocument();
      expect(editButton).toHaveClass('backdrop-blur', 'bg-white/10');
    });

    it('should not show modal initially', () => {
      render(<EditButton textToEdit="Sample text" />);
      
      const modal = screen.queryByRole('textbox');
      expect(modal).not.toBeInTheDocument();
    });

    it('should apply custom className when provided', () => {
      render(<EditButton textToEdit="Sample text" className="custom-class" />);
      
      const editButton = screen.getByRole('button', { name: /edit.button/i });
      expect(editButton).toHaveClass('custom-class');
    });
  });

  // Test 2: Handling onClick event - opening modal
  describe('Modal Opening', () => {
    it('should open modal when edit button is clicked', async () => {
      render(<EditButton textToEdit="Sample text" />);
      
      const editButton = screen.getByRole('button', { name: /edit.button/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
        expect(screen.getByText(/edit.title/i)).toBeInTheDocument();
      });
    });

    it('should display the initial text in textarea when modal opens', async () => {
      const initialText = "Initial text";
      render(<EditButton textToEdit={initialText} />);
      
      const editButton = screen.getByRole('button', { name: /edit.button/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        expect(textarea.value).toBe(initialText);
      });
    });
  });

  // Test 3: Text editing functionality
  describe('Text Editing', () => {
    it('should update text when user types in textarea', async () => {
      render(<EditButton textToEdit="Sample text" />);
      
      const editButton = screen.getByRole('button', { name: /edit.button/i });
      fireEvent.click(editButton);

      const textarea = await screen.findByRole('textbox');
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'New text');

      expect((textarea as HTMLTextAreaElement).value).toBe('New text');
    });

    it('should enforce maximum character length (60 chars)', async () => {
      render(<EditButton textToEdit="Short" />);
      
      const editButton = screen.getByRole('button', { name: /edit.button/i });
      fireEvent.click(editButton);

      const textarea = await screen.findByRole('textbox');
      const longText = 'a'.repeat(100); // Attempt to type 100 characters
      
      fireEvent.change(textarea, { target: { value: longText } });

      const textareaValue = (textarea as HTMLTextAreaElement).value;
      // Text should be trimmed to max length
      expect(textareaValue.replace(/\n/g, '').length).toBeLessThanOrEqual(60);
    });

    it('should auto-break lines every 25 characters', async () => {
      render(<EditButton textToEdit="" />);
      
      const editButton = screen.getByRole('button', { name: /edit.button/i });
      fireEvent.click(editButton);

      const textarea = await screen.findByRole('textbox');
      const text = 'a'.repeat(30); // Type 30 characters
      
      fireEvent.change(textarea, { target: { value: text } });

      const textareaValue = (textarea as HTMLTextAreaElement).value;
      // Should contain newline character
      expect(textareaValue).toContain('\n');
    });

    it('should enforce maximum of 3 lines', async () => {
      render(<EditButton textToEdit="" />);
      
      const editButton = screen.getByRole('button', { name: /edit.button/i });
      fireEvent.click(editButton);

      const textarea = await screen.findByRole('textbox');
      const longText = 'a'.repeat(80); // Enough for more than 3 lines
      
      fireEvent.change(textarea, { target: { value: longText } });

      const textareaValue = (textarea as HTMLTextAreaElement).value;
      const lineCount = (textareaValue.match(/\n/g) || []).length + 1;
      expect(lineCount).toBeLessThanOrEqual(3);
    });
  });

  // Test 4: Character counter display
  describe('Character Counter', () => {
    it('should display character count correctly', async () => {
      render(<EditButton textToEdit="Hello" />);
      
      const editButton = screen.getByRole('button', { name: /edit.button/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        // Looking for the character counter pattern
        const counter = screen.getByText(/edit.chars/i);
        expect(counter).toBeInTheDocument();
      });
    });
  });

  // Test 5: Save functionality
  describe('Save Functionality', () => {
    it('should call onSave callback with new text when save is clicked', async () => {
      const mockOnSave = jest.fn();
      render(<EditButton textToEdit="Original" onSave={mockOnSave} />);
      
      const editButton = screen.getByRole('button', { name: /edit.button/i });
      fireEvent.click(editButton);

      const textarea = await screen.findByRole('textbox');
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'Updated text');

      const saveButton = screen.getByText(/edit.save/i);
      fireEvent.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith('Updated text');
    });

    it('should close modal after saving', async () => {
      const mockOnSave = jest.fn();
      render(<EditButton textToEdit="Original" onSave={mockOnSave} />);
      
      const editButton = screen.getByRole('button', { name: /edit.button/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      const saveButton = screen.getByText(/edit.save/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      });
    });

    it('should disable save button when text is empty or whitespace only', async () => {
      render(<EditButton textToEdit="Original" />);
      
      const editButton = screen.getByRole('button', { name: /edit.button/i });
      fireEvent.click(editButton);

      const textarea = await screen.findByRole('textbox');
      await userEvent.clear(textarea);
      await userEvent.type(textarea, '   '); // Only whitespace

      const saveButton = screen.getByText(/edit.save/i);
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when text is not empty', async () => {
      render(<EditButton textToEdit="Original" />);
      
      const editButton = screen.getByRole('button', { name: /edit.button/i });
      fireEvent.click(editButton);

      const textarea = await screen.findByRole('textbox');
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'Valid text');

      const saveButton = screen.getByText(/edit.save/i);
      expect(saveButton).not.toBeDisabled();
    });
  });

  // Test 6: Cancel functionality
  describe('Cancel Functionality', () => {
    it('should close modal when cancel button is clicked', async () => {
      render(<EditButton textToEdit="Original" />);
      
      const editButton = screen.getByRole('button', { name: /edit.button/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText(/cancel/i);
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      });
    });

    it('should not call onSave when cancelled', async () => {
      const mockOnSave = jest.fn();
      render(<EditButton textToEdit="Original" onSave={mockOnSave} />);
      
      const editButton = screen.getByRole('button', { name: /edit.button/i });
      fireEvent.click(editButton);

      const textarea = await screen.findByRole('textbox');
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'New text');

      const cancelButton = screen.getByText(/cancel/i);
      fireEvent.click(cancelButton);

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should restore original text when reopening after cancel', async () => {
      const originalText = "Original text";
      render(<EditButton textToEdit={originalText} />);
      
      // Open modal
      const editButton = screen.getByRole('button', { name: /edit.button/i });
      fireEvent.click(editButton);

      // Edit text
      const textarea = await screen.findByRole('textbox');
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'Changed text');

      // Cancel
      const cancelButton = screen.getByText(/cancel/i);
      fireEvent.click(cancelButton);

      // Reopen modal
      fireEvent.click(editButton);

      // Check if original text is restored
      await waitFor(() => {
        const reopenedTextarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        expect(reopenedTextarea.value).toBe(originalText);
      });
    });
  });

  // Test 7: Component without onSave callback
  describe('Without onSave Callback', () => {
    it('should not throw error when onSave is not provided', async () => {
      render(<EditButton textToEdit="Sample text" />);
      
      const editButton = screen.getByRole('button', { name: /edit.button/i });
      fireEvent.click(editButton);

      const textarea = await screen.findByRole('textbox');
      await userEvent.type(textarea, ' Updated');

      const saveButton = screen.getByText(/edit.save/i);
      
      expect(() => fireEvent.click(saveButton)).not.toThrow();
    });
  });

  // Test 8: State management
  describe('State Management', () => {
    it('should maintain separate state for modal open/close', async () => {
      render(<EditButton textToEdit="Test" />);
      
      const editButton = screen.getByRole('button', { name: /edit.button/i });
      
      // Initially closed
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      
      // Open modal
      fireEvent.click(editButton);
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
      
      // Close modal
      const cancelButton = screen.getByText(/cancel/i);
      fireEvent.click(cancelButton);
      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      });
    });
  });
});
