import React from 'react';
import { Globe } from 'lucide-react';

// Matches:
// - http(s)://...
// - www....
// - bare domains like example.com / azero.com.co (optionally with path/query)
// Notes:
// - avoid emails via (?<!@)
// - avoid matching markdown link syntax handled elsewhere
const URL_REGEX = /(?<!@)\b(https?:\/\/[^\s<>"{}|\\^`[\]]+|www\.[^\s<>"{}|\\^`[\]]+|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,})(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?)(?!\w)/gi;

// Pattern to detect URLs wrapped in parentheses like "(url)"
const PARENTHESIZED_URL_REGEX = /\((?:https?:\/\/[^\s<>"{}|\\^`[\]]+|www\.[^\s<>"{}|\\^`[\]]+|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,})(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?)\)/gi;

const TRAILING_PUNCTUATION_REGEX = /[),.;:!?\]]+$/;

function normalizeHref(raw: string) {
  // Remove surrounding parentheses if present
  let cleaned = raw.replace(/^\(|\)$/g, '');
  cleaned = cleaned.replace(TRAILING_PUNCTUATION_REGEX, '');
  const href = cleaned.startsWith('www.') || cleaned.match(/^(?:[a-z0-9-]+\.)+[a-z]{2,}/i)
    ? `https://${cleaned}`
    : cleaned;
  const trailing = raw.replace(/^\(/, '').slice(cleaned.length).replace(/^\)/, '');
  return { href, cleaned, trailing };
}

function getDomainName(url: string): string {
  try {
    const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
    const hostname = new URL(cleanUrl).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  }
}

interface LinkifyTextProps {
  children: string;
  className?: string;
  /** If true, show icon only. If false, show domain text */
  iconOnly?: boolean;
}

/**
 * Component that converts plain URLs in text to clickable link icons
 */
export function LinkifyText({ children, className, iconOnly = true }: LinkifyTextProps) {
  if (!children || typeof children !== 'string') {
    return <>{children}</>;
  }

  // First, handle parenthesized URLs by removing the parentheses
  let processedText = children.replace(PARENTHESIZED_URL_REGEX, (match) => {
    return match.slice(1, -1); // Remove ( and )
  });

  const matches = Array.from(processedText.matchAll(URL_REGEX));
  if (matches.length === 0) return <span className={className}>{processedText}</span>;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;

  matches.forEach((m, idx) => {
    const raw = m[0];
    const start = m.index ?? 0;
    const end = start + raw.length;

    if (start > lastIndex) {
      nodes.push(processedText.slice(lastIndex, start));
    }

    const { href, cleaned, trailing } = normalizeHref(raw);
    const domain = getDomainName(cleaned);

    nodes.push(
      <a
        key={`link-${idx}-${start}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={cleaned}
        className="inline-flex items-center gap-1 text-primary hover:text-secondary transition-colors"
      >
        <Globe className="h-4 w-4 flex-shrink-0" />
        {!iconOnly && <span className="underline">{domain}</span>}
      </a>
    );

    if (trailing) nodes.push(trailing);
    lastIndex = end;
  });

  if (lastIndex < processedText.length) {
    nodes.push(processedText.slice(lastIndex));
  }

  return <span className={className}>{nodes}</span>;
}

/**
 * Function to preprocess markdown content and convert plain URLs to markdown links
 * This ensures ReactMarkdown renders them as clickable links
 * Also strips UTM parameters and cleans up surrounding brackets/parentheses
 */
export function linkifyMarkdown(content: string): string {
  if (!content) return content;
  
  // Helper to strip UTM parameters from URLs
  const stripUtm = (url: string): string => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      const params = urlObj.searchParams;
      // Remove UTM and common tracking parameters
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'ref'].forEach(p => params.delete(p));
      // Reconstruct URL without tracking params
      const cleanUrl = urlObj.origin + urlObj.pathname + (params.toString() ? '?' + params.toString() : '');
      return cleanUrl;
    } catch {
      return url;
    }
  };

  // Full URL pattern for matching
  const URL_PATTERN = /https?:\/\/[^\s<>"{}|\\^`[\]()]+|www\.[^\s<>"{}|\\^`[\]()]+|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,})(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?/gi;

  let processed = content;

  // 1) First, handle existing markdown links [text](url) - convert to icon format
  processed = processed.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    (_, _text, url) => {
      const cleanUrl = stripUtm(url);
      return `[↗](${cleanUrl})`;
    }
  );

  // 2) Remove parentheses/brackets wrapping around our icon links
  processed = processed
    .replace(/\(\[↗\]\(([^)]+)\)\)/g, '[↗]($1)')
    .replace(/\[\[↗\]\(([^)]+)\)\]/g, '[↗]($1)');

  // 3) Clean parenthesized URLs: (https://...) -> https://...
  processed = processed.replace(
    /\((https?:\/\/[^\s<>"{}|\\^`[\]()]+)\)/g,
    (_, url) => {
      const cleanUrl = stripUtm(url);
      return `[↗](${cleanUrl})`;
    }
  );

  // 4) Clean bracketed URLs: [https://...] -> icon link
  processed = processed.replace(
    /\[(https?:\/\/[^\]]+)\]/g,
    (_, url) => {
      const cleanUrl = stripUtm(url);
      return `[↗](${cleanUrl})`;
    }
  );

  // 5) Match bare URLs that are NOT already in markdown link format
  // Use negative lookbehind to avoid matching URLs already in [↗](url) format
  processed = processed.replace(
    /(?<!\]\()(?<!\[↗\]\()(https?:\/\/[^\s<>"{}|\\^`[\]()]+)/g,
    (url) => {
      const cleanUrl = stripUtm(url);
      return `[↗](${cleanUrl})`;
    }
  );

  // 6) Handle www. URLs
  processed = processed.replace(
    /(?<!\]\()(?<!\[↗\]\()\b(www\.[^\s<>"{}|\\^`[\]()]+)/gi,
    (url) => {
      const cleanUrl = stripUtm(`https://${url}`);
      return `[↗](${cleanUrl})`;
    }
  );

  // 7) Final cleanup - remove any leftover artifacts
  processed = processed
    .replace(/\(\s*:\/\/\s*\)/g, '')
    .replace(/\[\s*:\/\/\s*\]/g, '')
    .replace(/\(:\/\/\)/g, '')
    .replace(/\[:\/\/\]/g, '')
    // Remove standalone [↗] not followed by (url)
    .replace(/\[↗\](?!\()/g, '');
  
  return processed;
}
