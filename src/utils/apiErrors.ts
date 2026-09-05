export interface ParsedApiError {
  message: string;
  fields: Record<string, string>;
}

export function parseApiError(
  error: unknown,
  fallback: string,
): ParsedApiError {
  const data = (
    error as {
      response?: {
        data?: {
          message?: string;
          details?: { field: string; message: string }[];
        };
      };
    }
  ).response?.data;
  const fields = Object.fromEntries(
    (data?.details || []).map((detail) => [detail.field, detail.message]),
  );
  return { message: data?.message || fallback, fields };
}
