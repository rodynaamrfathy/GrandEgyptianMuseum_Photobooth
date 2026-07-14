import { renderHook, waitFor } from '@testing-library/react';
import {
  getImageFromUrl,
  fetchImageAsBlob,
  fetchImageFromAWSAPI,
  useRemoteImage,
} from '../useRemoteImage';

// Mock fetch globally
const mockFetch = global.fetch as jest.Mock;

describe('useRemoteImage Hook and Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (window as { location?: unknown }).location;
    process.env.NEXT_PUBLIC_AWS_API_BASE_URL = 'https://api.example.com';
    
    // Mock console.error to prevent error logs in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test 1: getImageFromUrl utility function
  describe('getImageFromUrl Utility', () => {
    it('should extract image parameter from URL', () => {
      (window as { location?: unknown }).location = {
        search: '?image=kiosk1_filter1_123456',
      } as Location;

      const imageId = getImageFromUrl();
      expect(imageId).toBe('kiosk1_filter1_123456');
    });

    it('should return null when image parameter is not present', () => {
      (window as { location?: unknown }).location = {
        search: '?other=value',
      } as Location;

      const imageId = getImageFromUrl();
      expect(imageId).toBe(null);
    });

    it('should return null when no query parameters', () => {
      (window as { location?: unknown }).location = {
        search: '',
      } as Location;

      const imageId = getImageFromUrl();
      expect(imageId).toBe(null);
    });

    it('should handle multiple query parameters', () => {
      (window as { location?: unknown }).location = {
        search: '?foo=bar&image=test123&baz=qux',
      } as Location;

      const imageId = getImageFromUrl();
      expect(imageId).toBe('test123');
    });

    it('should return null in SSR environment', () => {
      const originalWindow = global.window;
      delete (global as { window?: unknown }).window;

      const imageId = getImageFromUrl();
      expect(imageId).toBe(null);

      (global as { window?: unknown }).window = originalWindow;
    });
  });

  // Test 2: fetchImageAsBlob utility function
  describe('fetchImageAsBlob Utility', () => {
    it('should fetch and return blob from URL', async () => {
      const mockBlob = new Blob(['image data'], { type: 'image/jpeg' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });

      const result = await fetchImageAsBlob('https://example.com/image.jpg');
      
      expect(result).toBe(mockBlob);
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/image.jpg');
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(fetchImageAsBlob('https://example.com/missing.jpg'))
        .rejects.toThrow('Image fetch failed: 404');
    });

    it('should throw error when network error occurs', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchImageAsBlob('https://example.com/image.jpg'))
        .rejects.toThrow();
    });

    it('should log error to console on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Fetch failed'));

      try {
        await fetchImageAsBlob('https://example.com/image.jpg');
      } catch {
        // Expected to throw
      }

      expect(console.error).toHaveBeenCalledWith(
        'Failed to fetch image:',
        expect.any(Error)
      );
    });
  });

  // Test 3: fetchImageFromAWSAPI utility function
  describe('fetchImageFromAWSAPI Utility', () => {
    it('should construct correct API URL and fetch image', async () => {
      const mockBlob = new Blob(['image data'], { type: 'image/jpeg' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });

      const imageId = 'kiosk1_filter1_123456';
      const result = await fetchImageFromAWSAPI(imageId);

      expect(result).toBe(mockBlob);
      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.example.com/${imageId}`
      );
    });

    it('should use environment variable for base URL', async () => {
      process.env.NEXT_PUBLIC_AWS_API_BASE_URL = 'https://custom-api.com';
      
      const mockBlob = new Blob(['data'], { type: 'image/jpeg' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });

      await fetchImageFromAWSAPI('test123');

      expect(mockFetch).toHaveBeenCalledWith('https://custom-api.com/test123');
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API error'));

      await expect(fetchImageFromAWSAPI('invalid'))
        .rejects.toThrow();
    });

    it('should log errors to console', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Fetch failed'));

      try {
        await fetchImageFromAWSAPI('test');
      } catch {
        // Expected to throw
      }

      expect(console.error).toHaveBeenCalledWith(
        'Failed to fetch image from AWS:',
        expect.any(Error)
      );
    });
  });

  // Test 4: useRemoteImage hook - initial state
  describe('useRemoteImage Hook - Initial State', () => {
    it('should have default initial state', () => {
      (window as { location?: unknown }).location = { search: '' } as Location;

      const { result } = renderHook(() => useRemoteImage());

      expect(result.current.imageId).toBe('');
      expect(result.current.imageBlob).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  // Test 5: useRemoteImage hook - successful fetch
  describe('useRemoteImage Hook - Successful Fetch', () => {
    it('should fetch image when imageId is in URL', async () => {
      const mockBlob = new Blob(['image'], { type: 'image/jpeg' });
      (window as { location?: unknown }).location = {
        search: '?image=test123',
      } as Location;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });

      const { result } = renderHook(() => useRemoteImage());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.imageId).toBe('test123');
      expect(result.current.imageBlob).toBe(mockBlob);
      expect(result.current.error).toBe(null);
    });

    it('should call API with correct URL', async () => {
      const mockBlob = new Blob(['data'], { type: 'image/jpeg' });
      (window as { location?: unknown }).location = {
        search: '?image=kiosk2_filter3_987654',
      } as Location;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });

      renderHook(() => useRemoteImage());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.example.com/kiosk2_filter3_987654'
        );
      });
    });

    it('should set loading state correctly', async () => {
      const mockBlob = new Blob(['data'], { type: 'image/jpeg' });
      (window as { location?: unknown }).location = {
        search: '?image=test',
      } as Location;

      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(promise as Promise<Response>);

      const { result } = renderHook(() => useRemoteImage());

      expect(result.current.loading).toBe(true);

      resolvePromise!({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  // Test 6: useRemoteImage hook - error handling
  describe('useRemoteImage Hook - Error Handling', () => {
    it('should set error when fetch fails', async () => {
      (window as { location?: unknown }).location = {
        search: '?image=error123',
      } as Location;

      mockFetch.mockRejectedValueOnce(new Error('Fetch failed'));

      const { result } = renderHook(() => useRemoteImage());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Fetch failed');
      expect(result.current.imageBlob).toBe(null);
    });

    it('should set imageBlob to null on error', async () => {
      (window as { location?: unknown }).location = {
        search: '?image=test',
      } as Location;

      mockFetch.mockRejectedValueOnce(new Error('Error'));

      const { result } = renderHook(() => useRemoteImage());

      await waitFor(() => {
        expect(result.current.imageBlob).toBe(null);
      });
    });

    it('should stop loading on error', async () => {
      (window as { location?: unknown }).location = {
        search: '?image=test',
      } as Location;

      mockFetch.mockRejectedValueOnce(new Error('Error'));

      const { result } = renderHook(() => useRemoteImage());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  // Test 7: useRemoteImage hook - no imageId in URL
  describe('useRemoteImage Hook - No ImageId', () => {
    it('should not fetch when no imageId in URL', () => {
      (window as { location?: unknown }).location = {
        search: '',
      } as Location;

      renderHook(() => useRemoteImage());

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should remain in initial state when no imageId', () => {
      (window as { location?: unknown }).location = {
        search: '?other=value',
      } as Location;

      const { result } = renderHook(() => useRemoteImage());

      expect(result.current.imageId).toBe('');
      expect(result.current.imageBlob).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  // Test 8: useRemoteImage hook - return value structure
  describe('useRemoteImage Hook - Return Value', () => {
    it('should return object with all required properties', () => {
      (window as { location?: unknown }).location = { search: '' } as Location;

      const { result } = renderHook(() => useRemoteImage());

      expect(result.current).toHaveProperty('imageId');
      expect(result.current).toHaveProperty('imageBlob');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
    });
  });

  // Test 9: useRemoteImage hook - only runs once
  describe('useRemoteImage Hook - Effect Dependencies', () => {
    it('should only fetch once on mount', async () => {
      const mockBlob = new Blob(['data'], { type: 'image/jpeg' });
      (window as { location?: unknown }).location = {
        search: '?image=test',
      } as Location;

      mockFetch.mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });

      const { rerender } = renderHook(() => useRemoteImage());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Rerender shouldn't trigger another fetch
      rerender();
      rerender();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  // Test 10: Edge cases
  describe('Edge Cases', () => {
    it('should handle blob conversion errors gracefully', async () => {
      (window as { location?: unknown }).location = {
        search: '?image=test',
      } as Location;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.reject(new Error('Blob error')),
      });

      const { result } = renderHook(() => useRemoteImage());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should handle special characters in imageId', async () => {
      const mockBlob = new Blob(['data'], { type: 'image/jpeg' });
      const specialId = 'test_123-456';
      (window as { location?: unknown }).location = {
        search: `?image=${specialId}`,
      } as Location;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });

      const { result } = renderHook(() => useRemoteImage());

      await waitFor(() => {
        expect(result.current.imageId).toBe(specialId);
      });
    });

    it('should handle empty API base URL', async () => {
      process.env.NEXT_PUBLIC_AWS_API_BASE_URL = '';
      const mockBlob = new Blob(['data'], { type: 'image/jpeg' });
      (window as { location?: unknown }).location = {
        search: '?image=test',
      } as Location;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });

      renderHook(() => useRemoteImage());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/test');
      });
    });
  });
});
