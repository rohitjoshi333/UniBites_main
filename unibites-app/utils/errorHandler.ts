const STATUS_MESSAGES: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'Session expired. Please log in again.',
    403: "You don't have permission to do that.",
    404: 'The requested resource was not found.',
    408: 'Request timed out. Please try again.',
    429: 'Too many requests. Please wait a moment.',
    500: 'Something went wrong. Please try again later.',
    502: 'Server is temporarily unavailable. Please try again.',
    503: 'Service is temporarily unavailable. Please try again.',
};

export function getErrorMessage(error: any, fallback?: string): string {
    const defaultMsg = fallback || 'Something went wrong. Please try again.';

    if (!error) return defaultMsg;

    // Network / connection errors
    if (
        error instanceof TypeError &&
        error.message?.includes('Network request failed')
    ) {
        return 'Network error. Check your connection.';
    }

    if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (data?.message && typeof data.message === 'string') {
            return data.message;
        }

        if (data?.detail) return String(data.detail);
        if (data?.error) return String(data.error);

        if (typeof data === 'object' && data !== null) {
            for (const key of Object.keys(data)) {
                if (key === 'success') continue;
                const val = data[key];
                if (Array.isArray(val) && val.length > 0) {
                    return String(val[0]);
                }
                if (typeof val === 'string') {
                    return val;
                }
            }
        }

        if (STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];
    }

    if (error.message && typeof error.message === 'string') {
        const technical = [
            'JSON Parse error',
            'SyntaxError',
            'TypeError',
            'ReferenceError',
            'undefined is not',
            'Cannot read prop',
            'fetch',
        ];
        const isTechnical = technical.some((t) =>
            error.message.toLowerCase().includes(t.toLowerCase())
        );
        if (!isTechnical) return error.message;
    }

    return defaultMsg;
}

export async function safeJsonParse(response: Response): Promise<any | null> {
    try {
        const text = await response.text();
        if (!text) return null;
        return JSON.parse(text);
    } catch {
        console.log('safeJsonParse: Failed to parse response body');
        return null;
    }
}

export async function safeFetch(
    url: string,
    options?: RequestInit
): Promise<{ data: any; error: string | null; status: number }> {
    try {
        const response = await fetch(url, options);
        const data = await safeJsonParse(response);

        if (!response.ok) {
            const message =
                data?.message ||
                data?.detail ||
                data?.error ||
                STATUS_MESSAGES[response.status] ||
                'Something went wrong.';
            return { data, error: message, status: response.status };
        }

        return { data, error: null, status: response.status };
    } catch (err: any) {
        return {
            data: null,
            error: getErrorMessage(err),
            status: 0,
        };
    }
}
