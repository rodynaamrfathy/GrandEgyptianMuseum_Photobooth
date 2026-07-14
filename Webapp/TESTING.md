# Testing Documentation

## Overview

This project uses **Jest** and **React Testing Library** for comprehensive unit and UI testing of React components, utility functions, and custom hooks.

## Test Structure

```
src/
├── app/
│   ├── components/
│   │   ├── __tests__/
│   │   │   ├── EditButton.test.tsx
│   │   │   ├── EmailPopup.test.tsx
│   │   │   ├── FlippableCardProps.test.tsx
│   │   │   ├── Footer.test.tsx
│   │   │   ├── GetImageByEmail.test.tsx
│   │   │   ├── Header.test.tsx
│   │   │   ├── LoopingText.test.tsx
│   │   │   ├── ShareButton.test.tsx
│   │   │   └── SubmitButton.test.tsx
│   ├── hooks/
│   │   ├── __tests__/
│   │   │   ├── useCustomCard.test.ts
│   │   │   └── useRemoteImage.test.ts
│   ├── utils/
│   │   ├── __tests__/
│   │   │   └── createCardWithText.test.ts
```

## Installation

Install the required testing dependencies:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom @types/jest
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test EditButton.test.tsx
```

## Test Coverage

The test suite covers:

### Components
1. **EditButton** - Text editing modal with character limits and line breaks
2. **EmailPopup** - Email submission with validation and localStorage
3. **FlippableCard** - Auto-flipping card with manual controls
4. **Footer** - Static footer with translations
5. **GetImageByEmail** - Email sending with API integration
6. **Header** - Header with language toggle
7. **LoopingText** - Animated text carousel
8. **ShareButton** - Web Share API with fallback
9. **SubmitButton** - Reusable button component

### Hooks
1. **useCustomCard** - Custom card generation with template
2. **useRemoteImage** - Remote image fetching from AWS API

### Utilities
1. **createCardWithText** - Canvas-based card text overlay

## Test Categories

### 1. Rendering Tests
- Component renders without crashing
- Correct initial state
- Proper CSS classes and styling
- Conditional rendering logic

### 2. User Interaction Tests
- Button clicks
- Form submissions
- Text input changes
- Keyboard interactions

### 3. State Management Tests
- useState hooks
- State updates on user actions
- Component re-renders

### 4. API Integration Tests
- Fetch calls with correct parameters
- Success response handling
- Error response handling
- Loading states

### 5. Props Tests
- Different prop combinations
- Optional vs required props
- Prop validation

### 6. Accessibility Tests
- ARIA labels
- Keyboard navigation
- Screen reader support

## Mocking Strategy

### Global Mocks (jest.setup.js)
- `next/image` - Next.js Image component
- `react-i18next` - Translation library
- `localStorage` - Browser storage
- `fetch` - API calls
- `URL.createObjectURL` - Blob URL creation

### Component-Specific Mocks
- `next/navigation` - useSearchParams hook
- `lucide-react` - Icon components
- Custom hooks and utilities

## Writing New Tests

### Component Test Template

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  // Setup and teardown
  beforeEach(() => {
    // Reset mocks, clear state
  });

  describe('Rendering', () => {
    it('should render correctly', () => {
      render(<MyComponent />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle click events', () => {
      const handleClick = jest.fn();
      render(<MyComponent onClick={handleClick} />);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('State Changes', () => {
    it('should update state on interaction', async () => {
      render(<MyComponent />);
      
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByText('Updated')).toBeInTheDocument();
      });
    });
  });
});
```

### Hook Test Template

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useMyHook());
    
    expect(result.current.data).toBe(null);
    expect(result.current.loading).toBe(false);
  });

  it('should fetch data', async () => {
    const { result } = renderHook(() => useMyHook());
    
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });
});
```

## Best Practices

1. **Test Isolation** - Each test should be independent
2. **Descriptive Names** - Use clear test descriptions
3. **Arrange-Act-Assert** - Follow AAA pattern
4. **Mock External Dependencies** - Don't test third-party code
5. **Test User Behavior** - Focus on what users see and do
6. **Avoid Implementation Details** - Test the interface, not internals
7. **Use waitFor for Async** - Handle asynchronous operations properly
8. **Clean Up** - Reset mocks and state after each test

## Common Testing Patterns

### Testing Async Operations
```typescript
it('should handle async operation', async () => {
  mockFetch.mockResolvedValueOnce({ data: 'test' });
  
  render(<Component />);
  
  await waitFor(() => {
    expect(screen.getByText('test')).toBeInTheDocument();
  });
});
```

### Testing User Events
```typescript
import userEvent from '@testing-library/user-event';

it('should handle user input', async () => {
  render(<Component />);
  
  const input = screen.getByRole('textbox');
  await userEvent.type(input, 'Hello');
  
  expect(input).toHaveValue('Hello');
});
```

### Testing Loading States
```typescript
it('should show loading state', async () => {
  let resolvePromise;
  const promise = new Promise((resolve) => {
    resolvePromise = resolve;
  });
  
  mockFetch.mockReturnValueOnce(promise);
  
  render(<Component />);
  
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  
  resolvePromise({ data: 'test' });
  
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
});
```

### Testing Error States
```typescript
it('should handle errors', async () => {
  mockFetch.mockRejectedValueOnce(new Error('API Error'));
  
  render(<Component />);
  
  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

## Debugging Tests

### Run specific test
```bash
npm test -- -t "should render correctly"
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal"
}
```

### View test output
```bash
npm test -- --verbose
```

## Coverage Reports

After running `npm run test:coverage`, view the report:
- Open `coverage/lcov-report/index.html` in a browser
- Coverage threshold: Aim for >80% coverage

## Continuous Integration

Tests run automatically on:
- Pull requests
- Main branch commits
- Pre-deployment

## Troubleshooting

### Common Issues

1. **Test timeout**
   - Increase timeout: `jest.setTimeout(10000)`
   - Check for infinite loops or missing mock resolutions

2. **Mock not working**
   - Ensure mock is defined before component import
   - Clear mocks in beforeEach/afterEach

3. **Async test failures**
   - Use `waitFor` for async operations
   - Check promise resolution/rejection

4. **Cannot find module**
   - Check import paths
   - Verify jest.config.js moduleNameMapper

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Next.js Testing](https://nextjs.org/docs/testing)

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain coverage above 80%
4. Update this documentation if needed
