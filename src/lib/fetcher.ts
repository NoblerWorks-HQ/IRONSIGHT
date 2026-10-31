import { DOMParser, type Document as XmlDocument, type Element as XmlElement } from '@xmldom/xmldom';

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

// xmldom 0.9 throws ParseError on a non-well-formed feed; every caller runs inside try/allSettled.
export function parseXML(text: string): XmlDocument {
  const parser = new DOMParser();
  return parser.parseFromString(text, 'text/xml');
}

export function getTextContent(element: XmlElement, tagName: string): string {
  const el = element.getElementsByTagName(tagName)[0];
  return el?.textContent || '';
}
