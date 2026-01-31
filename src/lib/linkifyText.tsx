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

  // URL matcher (same shape as URL_REGEX but safe for markdown preprocessing)
  const URL_IN_TEXT_REGEX =
    /(?<!\]\(|<|@|\[)\b(https?:\/\/[^\s<>"{}|\\^`[\]()]+|www\.[^\s<>"{}|\\^`[\]()]+|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,})(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?)(?!\w)/gi;

  // 1) Clean wrappers around URLs: (url) / [url] / ([url]) / ([url])
  //    This avoids rendering leftover "(" ")" "[" "]" around the link icon.
  let processed = content
    .replace(
      /\(\s*(\[)?\s*(https?:\/\/[^\s<>"{}|\\^`[\]()]+|www\.[^\s<>"{}|\\^`[\]()]+|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,})(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?)\s*(\])?\s*\)/gi,
      (_, __, url) => url
    )
    .replace(
      /\[\s*(https?:\/\/[^\s<>"{}|\\^`[\]()]+|www\.[^\s<>"{}|\\^`[\]()]+|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,})(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?)\s*\]/gi,
      (_, url) => url
    );
  
  // 2) Handle existing markdown links [text](url) -> keep as icon-only
  processed = processed.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_, text, url) => {
      const cleanUrl = stripUtm(url);
      return `[🔗](${cleanUrl})`;
    }
  );

  // 3) If the markdown link itself is wrapped, unwrap it: ([🔗](url)) / [[🔗](url)]
  processed = processed
    .replace(/\(\s*\[🔗\]\(([^)]+)\)\s*\)/g, `[🔗]($1)`)
    .replace(/\[\s*\[🔗\]\(([^)]+)\)\s*\]/g, `[🔗]($1)`);
  
  // 4) Match URLs that are NOT already in markdown link format
  processed = processed.replace(
    URL_IN_TEXT_REGEX,
    (raw) => {
      const cleaned = raw.replace(TRAILING_PUNCTUATION_REGEX, '');
      const href = cleaned.startsWith('http') ? cleaned : `https://${cleaned}`;
      const cleanHref = stripUtm(href);
      const trailing = raw.slice(cleaned.length);
      return `[🔗](${cleanHref})${trailing}`;
    }
  );

  // 5) Final unwrap pass for cases like "([🔗](...))" produced in step 4
  processed = processed.replace(/\(\s*\[🔗\]\(([^)]+)\)\s*\)/g, `[🔗]($1)`);
  
  return processed;
}
