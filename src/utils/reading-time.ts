interface ReadingTimeResult {
  minutes: number;
  words: number;
  text: string;
}

export function calculateReadingTime(content: string): ReadingTimeResult {
  // Remove markdown syntax and HTML tags
  const cleanText = content
    .replace(/[#*`\[\]()]/g, '') // Remove markdown syntax
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  const words = cleanText.split(' ').filter(word => word.length > 0).length;
  const wordsPerMinute = 200; // Average reading speed
  const minutes = Math.ceil(words / wordsPerMinute);

  return {
    minutes,
    words,
    text: `${minutes} min read`
  };
}
