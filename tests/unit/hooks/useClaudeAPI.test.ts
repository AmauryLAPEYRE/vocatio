// tests/unit/hooks/useClaudeAPI.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useClaudeAPI } from '@/lib/api/claude';

// Mock de fetch
global.fetch = jest.fn();

describe('useClaudeAPI Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('sends message to Claude API', async () => {
    const mockResponse = {
      content: [{ type: 'text', text: 'Response from Claude' }],
      usage: {
        input_tokens: 10,
        output_tokens: 20
      }
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    const { result } = renderHook(() => useClaudeAPI());
    
    let response;
    await act(async () => {
      response = await result.current.sendMessage('Test prompt');
    });
    
    expect(global.fetch).toHaveBeenCalledWith('/api/claude', expect.objectContaining({
      method: 'POST',
      headers: expect.any(Object),
      body: expect.stringContaining('Test prompt')
    }));
    
    expect(response).toEqual({
      content: 'Response from Claude',
      tokenUsage: {
        input: 10,
        output: 20,
        total: 30
      }
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
  
  test('handles API errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'API Error' })
    });
    
    const { result } = renderHook(() => useClaudeAPI());
    
    await act(async () => {
      try {
        await result.current.sendMessage('Test prompt');
      } catch (error) {
        // Error expected
      }
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('API Error');
  });
  
  test('handles network errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));
    
    const { result } = renderHook(() => useClaudeAPI());
    
    await act(async () => {
      try {
        await result.current.sendMessage('Test prompt');
      } catch (error) {
        // Error expected
      }
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Network Error');
  });
});
