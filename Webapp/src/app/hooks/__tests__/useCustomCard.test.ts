import { renderHook, waitFor } from '@testing-library/react';
import { useCustomCard } from '../useCustomCard';
import { fetchImageAsBlob } from '../useRemoteImage';
import { createCardWithText } from '../../utils/createCardWithText';

// Mock dependencies
jest.mock('../useRemoteImage', () => ({
  fetchImageAsBlob: jest.fn(),
}));

jest.mock('../../utils/createCardWithText', () => ({
  createCardWithText: jest.fn(),
}));

const mockFetchImageAsBlob = fetchImageAsBlob as jest.MockedFunction<typeof fetchImageAsBlob>;
const mockCreateCardWithText = createCardWithText as jest.MockedFunction<typeof createCardWithText>;

describe('useCustomCard Hook', () => {
  const mockTemplateBlob = new Blob(['template'], { type: 'image/png' });
  const mockCardBlob = new Blob(['card'], { type: 'image/png' });
  const mockEditText = 'Custom message';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_CARD_TEMPLATE_URL = 'https://example.com/template.png';
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
  });

  // Test 1: Initial state
  describe('Initial State', () => {
    it('should have loading true initially', () => {
      mockFetchImageAsBlob.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useCustomCard('Test'));

      expect(result.current.loading).toBe(true);
      expect(result.current.customCardBlob).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should start fetching template on mount', () => {
      mockFetchImageAsBlob.mockResolvedValue(mockTemplateBlob);

      renderHook(() => useCustomCard('Test'));

      expect(mockFetchImageAsBlob).toHaveBeenCalledWith('https://example.com/template.png');
    });
  });

  // Test 2: Successful template fetch and card generation
  describe('Successful Card Generation', () => {
    it('should fetch template and generate custom card', async () => {
      mockFetchImageAsBlob.mockResolvedValue(mockTemplateBlob);
      mockCreateCardWithText.mockResolvedValue(mockCardBlob);

      const { result } = renderHook(() => useCustomCard(mockEditText));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.customCardBlob).toBe(mockCardBlob);
      expect(result.current.error).toBe(null);
    });

    it('should call createCardWithText with correct parameters', async () => {
      mockFetchImageAsBlob.mockResolvedValue(mockTemplateBlob);
      mockCreateCardWithText.mockResolvedValue(mockCardBlob);

      const customText = 'My custom text';
      renderHook(() => useCustomCard(customText));

      await waitFor(() => {
        expect(mockCreateCardWithText).toHaveBeenCalled();
      });

      const callArgs = mockCreateCardWithText.mock.calls[0];
      expect(callArgs[0]).toBe('blob:mock-url'); // template blob URL
      expect(callArgs[1]).toBe(customText); // edit text
      expect(callArgs[2]).toMatch(/\d{2}\.\d{2}\.\d{4}/); // date format DD.MM.YYYY
    });

    it('should include current date in card', async () => {
      mockFetchImageAsBlob.mockResolvedValue(mockTemplateBlob);
      mockCreateCardWithText.mockResolvedValue(mockCardBlob);

      renderHook(() => useCustomCard('Test'));

      await waitFor(() => {
        expect(mockCreateCardWithText).toHaveBeenCalled();
      });

      const dateArg = mockCreateCardWithText.mock.calls[0][2];
      // Verify date format
      expect(dateArg).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
    });

    it('should set loading to false after successful generation', async () => {
      mockFetchImageAsBlob.mockResolvedValue(mockTemplateBlob);
      mockCreateCardWithText.mockResolvedValue(mockCardBlob);

      const { result } = renderHook(() => useCustomCard('Test'));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  // Test 3: Error handling - template fetch failure
  describe('Template Fetch Error', () => {
    it('should set error when template fetch fails', async () => {
      const errorMessage = 'Failed to fetch template';
      mockFetchImageAsBlob.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useCustomCard('Test'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.customCardBlob).toBe(null);
    });

    it('should not call createCardWithText when template fetch fails', async () => {
      mockFetchImageAsBlob.mockRejectedValue(new Error('Fetch failed'));

      renderHook(() => useCustomCard('Test'));

      await waitFor(() => {
        expect(mockFetchImageAsBlob).toHaveBeenCalled();
      });

      expect(mockCreateCardWithText).not.toHaveBeenCalled();
    });
  });

  // Test 4: Error handling - card creation failure
  describe('Card Creation Error', () => {
    it('should set error when card creation fails', async () => {
      const errorMessage = 'Failed to create card';
      mockFetchImageAsBlob.mockResolvedValue(mockTemplateBlob);
      mockCreateCardWithText.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useCustomCard('Test'));

      await waitFor(() => {
        expect(mockCreateCardWithText).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });

      expect(result.current.customCardBlob).toBe(null);
    });
  });

  // Test 5: Updating edit text
  describe('Edit Text Updates', () => {
    it('should regenerate card when edit text changes', async () => {
      mockFetchImageAsBlob.mockResolvedValue(mockTemplateBlob);
      mockCreateCardWithText.mockResolvedValue(mockCardBlob);

      const { rerender } = renderHook(
        ({ text }) => useCustomCard(text),
        { initialProps: { text: 'Initial text' } }
      );

      await waitFor(() => {
        expect(mockCreateCardWithText).toHaveBeenCalledTimes(1);
      });

      // Change edit text
      rerender({ text: 'Updated text' });

      await waitFor(() => {
        expect(mockCreateCardWithText).toHaveBeenCalledTimes(2);
      });

      // Verify the new text was used
      const lastCallArgs = mockCreateCardWithText.mock.calls[1];
      expect(lastCallArgs[1]).toBe('Updated text');
    });

    it('should generate new card blob when text changes', async () => {
      const firstCardBlob = new Blob(['card1'], { type: 'image/png' });
      const secondCardBlob = new Blob(['card2'], { type: 'image/png' });
      
      mockFetchImageAsBlob.mockResolvedValue(mockTemplateBlob);
      mockCreateCardWithText
        .mockResolvedValueOnce(firstCardBlob)
        .mockResolvedValueOnce(secondCardBlob);

      const { result, rerender } = renderHook(
        ({ text }) => useCustomCard(text),
        { initialProps: { text: 'First' } }
      );

      await waitFor(() => {
        expect(result.current.customCardBlob).toBe(firstCardBlob);
      });

      rerender({ text: 'Second' });

      await waitFor(() => {
        expect(result.current.customCardBlob).toBe(secondCardBlob);
      });
    });
  });

  // Test 6: Template blob URL creation
  describe('Template Blob URL', () => {
    it('should create object URL from template blob', async () => {
      mockFetchImageAsBlob.mockResolvedValue(mockTemplateBlob);
      mockCreateCardWithText.mockResolvedValue(mockCardBlob);

      renderHook(() => useCustomCard('Test'));

      await waitFor(() => {
        expect(mockCreateCardWithText).toHaveBeenCalled();
      });

      expect(URL.createObjectURL).toHaveBeenCalledWith(mockTemplateBlob);
    });

    it('should pass blob URL to createCardWithText', async () => {
      mockFetchImageAsBlob.mockResolvedValue(mockTemplateBlob);
      mockCreateCardWithText.mockResolvedValue(mockCardBlob);

      renderHook(() => useCustomCard('Test'));

      await waitFor(() => {
        expect(mockCreateCardWithText).toHaveBeenCalled();
      });

      const urlArg = mockCreateCardWithText.mock.calls[0][0];
      expect(urlArg).toBe('blob:mock-url');
    });
  });

  // Test 7: Date formatting
  describe('Date Formatting', () => {
    it('should format date as DD.MM.YYYY', async () => {
      mockFetchImageAsBlob.mockResolvedValue(mockTemplateBlob);
      mockCreateCardWithText.mockResolvedValue(mockCardBlob);

      renderHook(() => useCustomCard('Test'));

      await waitFor(() => {
        expect(mockCreateCardWithText).toHaveBeenCalled();
      });

      const dateArg = mockCreateCardWithText.mock.calls[0][2];
      
      // Verify format
      expect(dateArg).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
      
      // Verify it's a valid date
      const parts = dateArg.split('.');
      expect(parseInt(parts[0])).toBeGreaterThanOrEqual(1);
      expect(parseInt(parts[0])).toBeLessThanOrEqual(31);
      expect(parseInt(parts[1])).toBeGreaterThanOrEqual(1);
      expect(parseInt(parts[1])).toBeLessThanOrEqual(12);
      expect(parseInt(parts[2])).toBeGreaterThan(2000);
    });

    it('should pad single-digit day and month with zero', async () => {
      mockFetchImageAsBlob.mockResolvedValue(mockTemplateBlob);
      mockCreateCardWithText.mockResolvedValue(mockCardBlob);

      // Mock Date to return single digits
      const mockDate = new Date('2026-01-05'); // Month 1, Day 5
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as Date);

      renderHook(() => useCustomCard('Test'));

      await waitFor(() => {
        expect(mockCreateCardWithText).toHaveBeenCalled();
      });

      const dateArg = mockCreateCardWithText.mock.calls[0][2];
      expect(dateArg).toMatch(/^0\d\.0\d\.\d{4}$/);

      jest.restoreAllMocks();
    });
  });

  // Test 8: Multiple hook instances
  describe('Multiple Hook Instances', () => {
    it('should handle multiple instances independently', async () => {
      mockFetchImageAsBlob.mockResolvedValue(mockTemplateBlob);
      mockCreateCardWithText.mockResolvedValue(mockCardBlob);

      const { result: result1 } = renderHook(() => useCustomCard('Text 1'));
      const { result: result2 } = renderHook(() => useCustomCard('Text 2'));

      await waitFor(() => {
        expect(result1.current.loading).toBe(false);
        expect(result2.current.loading).toBe(false);
      });

      expect(mockFetchImageAsBlob).toHaveBeenCalledTimes(2);
      expect(mockCreateCardWithText).toHaveBeenCalledTimes(2);
    });
  });

  // Test 9: Return value structure
  describe('Return Value', () => {
    it('should return object with correct properties', async () => {
      mockFetchImageAsBlob.mockResolvedValue(mockTemplateBlob);
      mockCreateCardWithText.mockResolvedValue(mockCardBlob);

      const { result } = renderHook(() => useCustomCard('Test'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toHaveProperty('customCardBlob');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
    });

    it('should return null for customCardBlob initially', () => {
      mockFetchImageAsBlob.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useCustomCard('Test'));

      expect(result.current.customCardBlob).toBe(null);
    });
  });

  // Test 10: Environment variable
  describe('Environment Variable', () => {
    it('should use NEXT_PUBLIC_CARD_TEMPLATE_URL from environment', () => {
      process.env.NEXT_PUBLIC_CARD_TEMPLATE_URL = 'https://custom.com/template.png';
      mockFetchImageAsBlob.mockResolvedValue(mockTemplateBlob);

      renderHook(() => useCustomCard('Test'));

      expect(mockFetchImageAsBlob).toHaveBeenCalledWith('https://custom.com/template.png');
    });

    it('should handle empty environment variable', () => {
      process.env.NEXT_PUBLIC_CARD_TEMPLATE_URL = '';
      mockFetchImageAsBlob.mockResolvedValue(mockTemplateBlob);

      renderHook(() => useCustomCard('Test'));

      expect(mockFetchImageAsBlob).toHaveBeenCalledWith('');
    });
  });
});
