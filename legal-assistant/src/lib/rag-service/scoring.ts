/**
 * Calculate relevance score between text and query
 * Simple implementation using keyword matching
 */
export function calculateRelevance(text: string, query: string): number {
  if (!text || !query) {
    return 0;
  }

  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  // Count exact phrase matches (highest weight)
  const exactMatches = (textLower.match(new RegExp(queryLower, 'g')) || []).length;
  
  // Count individual word matches
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
  let wordMatchCount = 0;
  
  for (const word of queryWords) {
    if (textLower.includes(word)) {
      wordMatchCount++;
    }
  }

  // Calculate base score
  const phraseScore = exactMatches * 2;
  const wordScore = (wordMatchCount / queryWords.length) * queryWords.length;
  
  // Normalize score to 0-1 range
  const totalScore = phraseScore + wordScore;
  const normalizedScore = Math.min(totalScore / (queryWords.length + 2), 1);

  return normalizedScore;
}

/**
 * Calculate Turkish character-aware relevance
 */
export function calculateRelevanceWithTurkish(text: string, query: string): number {
  // Handle Turkish character variations
  const turkishMap: Record<string, string[]> = {
    'i': ['i', 'ı', 'İ', 'I'],
    'ı': ['ı', 'i', 'I', 'İ'],
    'ş': ['ş', 's', 'Ş', 'S'],
    'ğ': ['ğ', 'g', 'Ğ', 'G'],
    'ü': ['ü', 'u', 'Ü', 'U'],
    'ö': ['ö', 'o', 'Ö', 'O']
  };

  let enhancedText = text;
  for (const [char, variants] of Object.entries(turkishMap)) {
    for (const variant of variants) {
      const regex = new RegExp(variant, 'gi');
      enhancedText = enhancedText.replace(regex, `[${char}]`);
    }
  }

  const enhancedQuery = query.split('').map(char => {
    const lower = char.toLowerCase();
    return turkishMap[lower] ? `[${lower}]` : char;
  }).join('');

  return calculateRelevance(enhancedText, enhancedQuery);
}

