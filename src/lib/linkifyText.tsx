import React from 'react';

// Matches:
// - http(s)://...
// - www....
// - bare domains like example.com / azero.com.co (optionally with path/query)
// Notes:
// - avoid emails via (?<!@)
// - avoid matching markdown link syntax handled elsewhere
const URL_REGEX = /(?<!@)\b(https?:\/\/[^\s<>"{}|\\^`[\]]+|www\.[^\s<>"{}|\\^`[\]]+|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,})(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?)(?!\w)/gi;

const TRAILING_PUNCTUATION_REGEX = /[),.;:!?\]]+$/;

function normalizeHref(raw: string) {
  const cleaned = raw.replace(TRAILING_PUNCTUATION_REGEX, '');
  const href = cleaned.startsWith('www.') || cleaned.match(/^(?:[a-z0-9-]+\.)+[a-z]{2,}/i)
    ? `https://${cleaned}`
    : cleaned;
  const trailing = raw.slice(cleaned.length);
  return { href, display: raw, cleaned, trailing };
}

interface LinkifyTextProps {
  children: string;
  className?: string;
}

/**
 * Component that converts plain URLs in text to clickable links
 */
export function LinkifyText({ children, className }: LinkifyTextProps) {
  if (!children || typeof children !== 'string') {
    return <>{children}</>;
  }

  const matches = Array.from(children.matchAll(URL_REGEX));
  if (matches.length === 0) return <span className={className}>{children}</span>;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;

  matches.forEach((m, idx) => {
    const raw = m[0];
    const start = m.index ?? 0;
    const end = start + raw.length;

    if (start > lastIndex) {
      nodes.push(children.slice(lastIndex, start));
    }

    const { href, cleaned, trailing } = normalizeHref(raw);

    nodes.push(
      <a
        key={`link-${idx}-${start}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline break-all"
      >
        {cleaned}
      </a>
    );

    if (trailing) nodes.push(trailing);
    lastIndex = end;
  });

  if (lastIndex < children.length) {
    nodes.push(children.slice(lastIndex));
  }

  return <span className={className}>{nodes}</span>;
}

/**
 * Function to preprocess markdown content and convert plain URLs to markdown links
 * This ensures ReactMarkdown renders them as clickable links
 */
export function linkifyMarkdown(content: string): string {
  if (!content) return content;
  
  // Match URLs that are NOT already in markdown link format [text](url) or <url>
  // Also skip URLs that are already part of a markdown link
  return content.replace(
    /(?<!\]\(|<|@)(https?:\/\/[^\s<>"{}|\\^`[\]()]+|www\.[^\s<>"{}|\\^`[\]()]+|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,})(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?)(?!\))/gi,
    (raw) => {
      const cleaned = raw.replace(TRAILING_PUNCTUATION_REGEX, '');
      const href = cleaned.startsWith('http') ? cleaned : `https://${cleaned}`;
      const trailing = raw.slice(cleaned.length);
      // Keep full text for domains; truncate only huge URLs
      const displayText = cleaned.length > 60 ? `${cleaned.substring(0, 57)}...` : cleaned;
      return `[${displayText}](${href})${trailing}`;
    }
  );
}
