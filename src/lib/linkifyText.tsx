import React from 'react';

// Regex to match URLs in text (supports http, https, and www)
const URL_REGEX = /(https?:\/\/[^\s<>"{}|\\^`[\]]+|www\.[^\s<>"{}|\\^`[\]]+)/gi;

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

  const parts = children.split(URL_REGEX);
  
  if (parts.length === 1) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (URL_REGEX.test(part)) {
          // Reset regex lastIndex since we're testing again
          URL_REGEX.lastIndex = 0;
          const href = part.startsWith('www.') ? `https://${part}` : part;
          return (
            <a
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </span>
  );
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
    /(?<!\]\(|<)(https?:\/\/[^\s<>"{}|\\^`[\]()]+|www\.[^\s<>"{}|\\^`[\]()]+)(?!\))/gi,
    (match) => {
      const href = match.startsWith('www.') ? `https://${match}` : match;
      // Truncate display text for very long URLs
      const displayText = match.length > 50 ? match.substring(0, 47) + '...' : match;
      return `[${displayText}](${href})`;
    }
  );
}
