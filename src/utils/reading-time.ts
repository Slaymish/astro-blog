interface ReadingTimeResult {
  minutes: number;
  words: number;
  text: string;
}

// Set for O(1) lookups of markdown syntax characters
const MARKDOWN_CHARS = new Set(['#', '*', '`', '[', ']', '(', ')']);

export function calculateReadingTime(content: string): ReadingTimeResult {
  // Single-pass word counting - more efficient than chained replace + split
  let words = 0;
  let inWord = false;
  let inTag = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    // Skip HTML tags
    if (char === '<') {
      inTag = true;
      if (inWord) {
        words++;
        inWord = false;
      }
      continue;
    }
    if (char === '>') {
      inTag = false;
      continue;
    }
    if (inTag) continue;
    
    // Skip markdown syntax characters using Set for O(1) lookup
    if (MARKDOWN_CHARS.has(char)) {
      continue;
    }
    
    // Check if character is whitespace
    const isWhitespace = char === ' ' || char === '\n' || char === '\t' || char === '\r';
    
    if (isWhitespace) {
      if (inWord) {
        words++;
        inWord = false;
      }
    } else {
      inWord = true;
    }
  }
  
  // Count last word if content doesn't end with whitespace
  if (inWord) {
    words++;
  }

  const wordsPerMinute = 200; // Average reading speed
  const minutes = Math.ceil(words / wordsPerMinute);

  return {
    minutes,
    words,
    text: `${minutes} min read`
  };
}
