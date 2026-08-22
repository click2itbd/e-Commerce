import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();

describe('Server CpanelHostingProvider', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });

  it('testConnection calls correct WHM endpoint with Authorization header', async () => {
    const { CpanelHostingProvider } = await import(
      '../../../server/providers/hosting/CpanelHostingProvider'
    );

    const provider = new CpanelHostingProvider(
      'TEST_WHM_TOKEN',
      'https://server2025.click2it.bd:2087',
      'root'
    );

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        data: { acct: [{ user: 'test' }] },
      }),
    });

    const result = await provider.testConnection();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://server2025.click2it.bd:2087/json-api/listaccts?api.version=1');
    expect(options.method).toBe('GET');
    expect(options.headers.Authorization).toBe('whm root:TEST_WHM_TOKEN');
    expect(options.headers.Accept).toBe('application/json');
    expect(result.success).toBe(true);
    expect(result.code).toBe('WHM_OK');
  });

  it('testConnection classifies auth failure', async () => {
    const { CpanelHostingProvider } = await import(
      '../../../server/providers/hosting/CpanelHostingProvider'
    );

    const provider = new CpanelHostingProvider(
      'TEST_WHM_TOKEN',
      'https://server2025.click2it.bd:2087',
      'root'
    );

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({
        metadata: { result: { message: 'Invalid authentication' } },
      }),
    });

    const result = await provider.testConnection();
    expect(result.success).toBe(false);
    expect(result.code).toBe('WHM_AUTH_FAILED');
    expect(result.message).toMatch(/auth/i);
  });

  it('testConnection classifies wrong endpoint', async () => {
    const { CpanelHostingProvider } = await import(
      '../../../server/providers/hosting/CpanelHostingProvider'
    );

    const provider = new CpanelHostingProvider(
      'TEST_WHM_TOKEN',
      'https://server2025.click2it.bd:2087',
      'root'
    );

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => JSON.stringify({
        metadata: { result: { message: 'Endpoint not found' } },
      }),
    });

    const result = await provider.testConnection();
    expect(result.success).toBe(false);
    expect(result.code).toBe('WHM_NOT_FOUND');
    expect(result.message).toMatch(/endpoint/i);
  });

  it('testConnection classifies timeout correctly', async () => {
    const { CpanelHostingProvider } = await import(
      '../../../server/providers/hosting/CpanelHostingProvider'
    );

    const provider = new CpanelHostingProvider(
      'TEST_WHM_TOKEN',
      'https://server2025.click2it.bd:2087',
      'root'
    );

    const abortError = new Error('The user aborted a request.');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortError);

    const result = await provider.testConnection();
    expect(result.success).toBe(false);
    expect(result.code).toBe('WHM_TIMEOUT');
    expect(result.message).toMatch(/did not respond within 15 seconds/i);
  });

  it('testConnection classifies TLS error', async () => {
    const { CpanelHostingProvider } = await import(
      '../../../server/providers/hosting/CpanelHostingProvider'
    );

    const provider = new CpanelHostingProvider(
      'TEST_WHM_TOKEN',
      'https://server2025.click2it.bd:2087',
      'root'
    );

    mockFetch.mockRejectedValueOnce(
      new Error('self-signed certificate in certificate chain')
    );

    const result = await provider.testConnection();
    expect(result.success).toBe(false);
    expect(result.code).toBe('WHM_TLS_ERROR');
    expect(result.message).toMatch(/certificate|TLS|SSL/i);
  });

  it('testConnection classifies connection refused', async () => {
    const { CpanelHostingProvider } = await import(
      '../../../server/providers/hosting/CpanelHostingProvider'
    );

    const provider = new CpanelHostingProvider(
      'TEST_WHM_TOKEN',
      'https://server2025.click2it.bd:2087',
      'root'
    );

    mockFetch.mockRejectedValueOnce(new Error('connect ECONNREFUSED'));

    const result = await provider.testConnection();
    expect(result.success).toBe(false);
    expect(result.code).toBe('WHM_CONNECTION_REFUSED');
    expect(result.message).toMatch(/reach|cannot connect/i);
  });

  it('never logs or returns the actual token', async () => {
    const { CpanelHostingProvider } = await import(
      '../../../server/providers/hosting/CpanelHostingProvider'
    );

    const provider = new CpanelHostingProvider(
      'SECRET_WHM_TOKEN_123',
      'https://server2025.click2it.bd:2087',
      'root'
    );

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({
        metadata: { result: { message: 'Invalid authentication' } },
      }),
    });

    const result = await provider.testConnection();
    expect(result.message).not.toContain('SECRET_WHM_TOKEN_123');
    expect(result.message).not.toMatch(/whm\s+[A-Za-z0-9_\-]{20,}/i);
  });
});
