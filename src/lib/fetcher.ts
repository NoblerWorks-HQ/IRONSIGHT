import { DOMParser } from '@xmldom/xmldom';

export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 10000, ...fetchOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      cache: 'no-store',
    });
    return response;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`Fetch timeout after ${timeout}ms: ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

export function parseXML(text: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(text, 'text/xml');
}

export function getTextContent(element: Element, tagName: string): string {
  const el = element.getElementsByTagName(tagName)[0];
  return el?.textContent || '';
}
