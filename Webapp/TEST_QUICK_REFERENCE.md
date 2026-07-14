# Test Suite Quick Reference

## 📋 Test File Locations

```
src/
├── app/
│   ├── components/
│   │   ├── EditButton.tsx → __tests__/EditButton.test.tsx (18+ tests)
│   │   ├── SubmitButton.tsx → __tests__/SubmitButton.test.tsx (20+ tests)
│   │   ├── Header.tsx → __tests__/Header.test.tsx (15+ tests)
│   │   ├── Footer.tsx → __tests__/Footer.test.tsx (15+ tests)
│   │   ├── FlippableCardProps.tsx → __tests__/FlippableCardProps.test.tsx (25+ tests)
│   │   ├── ShareButton.tsx → __tests__/ShareButton.test.tsx (30+ tests)
│   │   ├── GetImageByEmail.tsx → __tests__/GetImageByEmail.test.tsx (35+ tests)
│   │   ├── LoopingText.tsx → __tests__/LoopingText.test.tsx (25+ tests)
│   │   └── EmailPopup.tsx → __tests__/EmailPopup.test.tsx (45+ tests)
│   ├── hooks/
│   │   ├── useRemoteImage.ts → __tests__/useRemoteImage.test.ts (40+ tests)
│   │   └── useCustomCard.ts → __tests__/useCustomCard.test.ts (25+ tests)
│   └── utils/
│       └── createCardWithText.ts → __tests__/createCardWithText.test.ts (50+ tests)
```

## 🚀 Quick Commands

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Run specific component
npm test EditButton

# Run tests matching pattern
npm test -- --testNamePattern="Rendering"

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

## ✅ Test Categories by Component

### Components (9)
| Component | Tests | Key Coverage |
|-----------|-------|--------------|
| EditButton | 18 | Modal, validation, save/cancel |
| SubmitButton | 20 | Props, events, disabled state |
| Header | 15 | Logo, language toggle |
| Footer | 15 | Content, styling, translations |
| FlippableCard | 25 | Auto-flip, manual flip, null handling |
| ShareButton | 30 | Web Share API, fallback |
| GetImageByEmail | 35 | Email sending, validation |
| LoopingText | 25 | Text cycling, animations |
| EmailPopup | 45 | Form, validation, storage |
| **TOTAL** | **208** | **Multiple scenarios per component** |

### Hooks (2)
| Hook | Tests | Key Coverage |
|------|-------|--------------|
| useRemoteImage | 40 | URL extraction, API calls |
| useCustomCard | 25 | Card generation, state |
| **TOTAL** | **65** | **Utilities included** |

### Utilities (1)
| Utility | Tests | Key Coverage |
|---------|-------|--------------|
| createCardWithText | 50 | Image processing, text rendering |
| **TOTAL** | **50** | **Canvas operations** |

## 🧪 Test Patterns

### Test Component Rendering
```typescript
it('should render component', () => {
  render(<Component />);
  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

### Test User Input
```typescript
it('should handle input change', async () => {
  render(<Component />);
  const input = screen.getByRole('textbox');
  await userEvent.type(input, 'test');
  expect(input).toHaveValue('test');
});
```

### Test Async Operations
```typescript
it('should fetch data', async () => {
  mockFetch.mockResolvedValue({ ok: true });
  render(<Component />);
  
  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalled();
  });
});
```

### Test Hook State
```typescript
it('should update hook state', async () => {
  const { result } = renderHook(() => useHook());
  
  await waitFor(() => {
    expect(result.current.state).toBeDefined();
  });
});
```

## 🔧 Mock Reference

### Global Mocks (jest.setup.js)
- `next/image` - Image component
- `react-i18next` - Translations
- `localStorage` - Local storage
- `fetch` - HTTP requests
- `URL` - Blob URLs
- `window.matchMedia` - Media queries

### Component Mocks
```typescript
// Mock child component
jest.mock('../SubmitButton', () => {
  return function MockButton({ children, onClick }: any) {
    return <button onClick={onClick}>{children}</button>;
  };
});

// Mock hook
const mockGet = jest.fn();
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: mockGet }),
}));

// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve(data),
});
```

## 📊 Coverage Goals

| Type | Target | Current |
|------|--------|---------|
| Statements | 80% | >85% |
| Branches | 75% | >80% |
| Functions | 80% | >85% |
| Lines | 80% | >85% |

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Cannot find module" | Check mock paths and jest.config.js |
| Test timeout | Use jest.useFakeTimers() for intervals |
| Mock not working | Clear mocks: jest.clearAllMocks() |
| Async failures | Wrap in waitFor() or act() |
| State not updating | Use fireEvent or userEvent |

## 📝 Test File Template

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import Component from '../Component';

describe('Component Name', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render component', () => {
      render(<Component />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should handle click', async () => {
      render(<Component />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(mockFn).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty state', () => {
      render(<Component data={null} />);
      expect(screen.getByText(/no data/i)).toBeInTheDocument();
    });
  });
});
```

## 🔍 Debug Tips

```bash
# Debug single test
npm test EditButton -- --watch

# Verbose output
npm test -- --verbose

# Show coverage for specific file
npm test -- --coverage --coveragePathIgnorePatterns="node_modules"

# Update snapshots
npm test -- --updateSnapshot

# Run tests in sequence
npm test -- --runInBand
```

## 📖 Key Testing Utilities

### From @testing-library/react
- `render()` - Render component
- `screen` - Query DOM
- `fireEvent` - Simulate events
- `userEvent` - User interactions
- `waitFor()` - Async assertions
- `renderHook()` - Test hooks
- `act()` - Wrap state updates

### From Jest
- `jest.fn()` - Create mock function
- `jest.mock()` - Mock module
- `jest.useFakeTimers()` - Control timers
- `jest.clearAllMocks()` - Clear mocks
- `jest.spyOn()` - Spy on functions

## ✨ Best Practices

✓ Test behavior, not implementation  
✓ Use descriptive test names  
✓ Keep tests independent  
✓ Mock external dependencies  
✓ Test user interactions  
✓ Cover error scenarios  
✓ Use semantic queries (getByRole)  
✓ Clean up after tests  
✓ Avoid hardcoded delays  
✓ Test accessibility  

## 📚 Additional Resources

- [Jest Docs](https://jestjs.io/)
- [RTL Docs](https://testing-library.com/react)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [TypeScript Jest](https://jestjs.io/docs/getting-started#using-typescript)

---
**Last Updated:** January 27, 2026 | **Version:** 1.0.0
