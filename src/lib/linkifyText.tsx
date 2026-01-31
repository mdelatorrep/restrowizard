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
 * This ensures ReactMarkdown renders them as clickable links with a globe icon
 */
export function linkifyMarkdown(content: string): string {
  if (!content) return content;
  
  let processed = content;

  // Step 1: Convert existing markdown links [text](url) to icon format [↗](url)
  // Be careful with URLs that contain parentheses - use a more precise pattern
  processed = processed.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    (_, _text, url) => `[↗](${url})`
  );

  // Step 2: Clean up URLs wrapped in parentheses: (https://...) -> [↗](url)
  processed = processed.replace(
    /\(\s*(https?:\/\/[^)\s]+)\s*\)/g,
    (_, url) => `[↗](${url})`
  );

  // Step 3: Clean up URLs wrapped in brackets: [https://...] -> [↗](url)
  processed = processed.replace(
    /\[\s*(https?:\/\/[^\]\s]+)\s*\]/g,
    (_, url) => `[↗](${url})`
  );

  // Step 4: Convert bare URLs (not already in markdown link format)
  // Use a simpler approach: match URLs that are NOT preceded by ]( or ](
  const bareUrlRegex = /(^|[^[(])(https?:\/\/[^\s<>"{}|\\^`[\]()]+)/gm;
  processed = processed.replace(bareUrlRegex, (match, prefix, url) => {
    // Don't convert if it's already part of a markdown link
    if (prefix === '(' || prefix === '[') return match;
    return `${prefix}[↗](${url})`;
  });

  // Step 5: Handle www. URLs (add https://)
  processed = processed.replace(
    /(^|[\s([])www\.([^\s<>"{}|\\^`[\]()]+)/gim,
    (_, prefix, domain) => `${prefix}[↗](https://www.${domain})`
  );

  // Step 6: Remove duplicate/nested link markers
  // Fix cases like [[↗](url)] or ([↗](url))
  processed = processed
    .replace(/\[\s*\[↗\]\(([^)]+)\)\s*\]/g, '[↗]($1)')
    .replace(/\(\s*\[↗\]\(([^)]+)\)\s*\)/g, '[↗]($1)');

  // Step 7: Clean up any orphaned [↗] without a following (url)
  processed = processed.replace(/\[↗\](?!\()/g, '');

  return processed;
}
