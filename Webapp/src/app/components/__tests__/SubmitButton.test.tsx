import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SubmitButton from '../SubmitButton';

describe('SubmitButton Component', () => {
  // Test 1: Renders correctly with children
  describe('Rendering', () => {
    it('should render button with children text', () => {
      render(<SubmitButton>Submit</SubmitButton>);
      
      const button = screen.getByRole('button', { name: /submit/i });
      expect(button).toBeInTheDocument();
    });

    it('should render button with complex children', () => {
      render(
        <SubmitButton>
          <span>Click</span> Me
        </SubmitButton>
      );
      
      expect(screen.getByText(/click/i)).toBeInTheDocument();
      expect(screen.getByText(/me/i)).toBeInTheDocument();
    });
  });

  // Test 2: Button types
  describe('Button Types', () => {
    it('should default to type="button"', () => {
      render(<SubmitButton>Click</SubmitButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should accept type="submit"', () => {
      render(<SubmitButton type="submit">Submit Form</SubmitButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  // Test 3: Click handling
  describe('Click Handling', () => {
    it('should call onClick handler when clicked', () => {
      const handleClick = jest.fn();
      render(<SubmitButton onClick={handleClick}>Click Me</SubmitButton>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(
        <SubmitButton onClick={handleClick} disabled>
          Disabled
        </SubmitButton>
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should work without onClick handler', () => {
      render(<SubmitButton>No Handler</SubmitButton>);
      
      const button = screen.getByRole('button');
      expect(() => fireEvent.click(button)).not.toThrow();
    });
  });

  // Test 4: Disabled state
  describe('Disabled State', () => {
    it('should be enabled by default', () => {
      render(<SubmitButton>Enabled</SubmitButton>);
      
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<SubmitButton disabled>Disabled</SubmitButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should apply disabled opacity class when disabled', () => {
      render(<SubmitButton disabled>Disabled</SubmitButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:opacity-40');
    });

    it('should toggle disabled state correctly', () => {
      const { rerender } = render(<SubmitButton disabled>Button</SubmitButton>);
      
      let button = screen.getByRole('button');
      expect(button).toBeDisabled();
      
      rerender(<SubmitButton disabled={false}>Button</SubmitButton>);
      
      button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });
  });

  // Test 5: Custom className
  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      render(<SubmitButton className="custom-class">Button</SubmitButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should combine custom className with default classes', () => {
      render(<SubmitButton className="extra-class">Button</SubmitButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('extra-class', 'bg-white', 'text-black');
    });

    it('should handle empty className', () => {
      render(<SubmitButton className="">Button</SubmitButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white');
    });
  });

  // Test 6: Default styling classes
  describe('Default Styling', () => {
    it('should have correct padding classes', () => {
      render(<SubmitButton>Button</SubmitButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-2');
    });

    it('should have correct color classes', () => {
      render(<SubmitButton>Button</SubmitButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white', 'text-black');
    });

    it('should have rounded corners', () => {
      render(<SubmitButton>Button</SubmitButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('rounded-[16px]');
    });

    it('should have hover effects', () => {
      render(<SubmitButton>Button</SubmitButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-[#E87518]', 'hover:text-white');
    });

    it('should have transition class', () => {
      render(<SubmitButton>Button</SubmitButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition');
    });

    it('should have font-greta-sans class', () => {
      render(<SubmitButton>Button</SubmitButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('font-greta-sans');
    });
  });

  // Test 7: Props combinations
  describe('Props Combinations', () => {
    it('should handle all props together', () => {
      const handleClick = jest.fn();
      render(
        <SubmitButton
          type="submit"
          onClick={handleClick}
          disabled={false}
          className="custom"
        >
          All Props
        </SubmitButton>
      );
      
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).not.toBeDisabled();
      expect(button).toHaveClass('custom');
      
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalled();
    });

    it('should handle minimal props', () => {
      render(<SubmitButton>Minimal</SubmitButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
      expect(button).not.toBeDisabled();
    });
  });

  // Test 8: Accessibility
  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      render(<SubmitButton>Accessible</SubmitButton>);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should have button role', () => {
      render(<SubmitButton>Button</SubmitButton>);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should not be focusable when disabled', () => {
      render(<SubmitButton disabled>Disabled</SubmitButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  // Test 9: Edge cases
  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(<SubmitButton>{''}</SubmitButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle null onClick', () => {
      render(<SubmitButton onClick={undefined}>No Handler</SubmitButton>);
      
      const button = screen.getByRole('button');
      expect(() => fireEvent.click(button)).not.toThrow();
    });

    it('should handle rapid clicks', () => {
      const handleClick = jest.fn();
      render(<SubmitButton onClick={handleClick}>Rapid</SubmitButton>);
      
      const button = screen.getByRole('button');
      
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });

  // Test 10: Component reusability
  describe('Reusability', () => {
    it('should render multiple instances independently', () => {
      const handleClick1 = jest.fn();
      const handleClick2 = jest.fn();

      render(
        <>
          <SubmitButton onClick={handleClick1}>Button 1</SubmitButton>
          <SubmitButton onClick={handleClick2}>Button 2</SubmitButton>
        </>
      );
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      
      fireEvent.click(buttons[0]);
      expect(handleClick1).toHaveBeenCalledTimes(1);
      expect(handleClick2).not.toHaveBeenCalled();
      
      fireEvent.click(buttons[1]);
      expect(handleClick2).toHaveBeenCalledTimes(1);
      expect(handleClick1).toHaveBeenCalledTimes(1);
    });
  });
});
