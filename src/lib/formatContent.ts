export const formatContent = (text: string | undefined | null): string => {
  if (!text) return '';
  
  try {
    return text
      // Format code blocks with proper indentation
      .replace(/```([\w-]+)?\s*([\s\S]+?)```/g, (_, lang, code) => {
        // Normalize language names
        const normalizedLang = lang?.toLowerCase() || '';
        const language = normalizeLanguage(normalizedLang);
        
        if (!code) return '';
        
        // Process code indentation
        const lines = code.split('\n');
        const nonEmptyLines = lines.filter((line: string) => line.trim());
        
        // Find minimum indentation
        const minIndent = Math.min(
          ...nonEmptyLines.map((line: string) => {
            const match = line.match(/^\s*/);
            return match ? match[0].length : 0;
          })
        );

        // Normalize indentation and ensure proper formatting
        const formattedCode = lines
          .map((line: string) => line.trim() ? line.slice(minIndent) : '')
          .join('\n')
          .trim();

        return `\n\`\`\`${language}\n${formattedCode}\n\`\`\`\n`;
      })
      // Handle other formatting
      .replace(/`([^`]+)`/g, (_, code) => `\`${code.trim()}\``)
      .replace(/(\d+\.)\s+/g, '\n$1 ')
      .replace(/\[([^\]]+)\]/g, (_, equation) => {
        if (!equation) return '';
        return equation
          .replace(/\\int/g, '∫')
          .replace(/\\frac{([^}]+)}{([^}]+)}/g, '$1/$2')
          .replace(/\\quad/g, '  ')
          .replace(/\\neq/g, '≠')
          .replace(/\\ln/g, 'ln')
          .replace(/dx/g, ' dx')
          .replace(/du/g, ' du')
          .replace(/[{}\\]/g, '')
          .trim();
      })
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } catch (error) {
    console.warn('Error formatting content:', error);
    return text;
  }
};

// Language normalization helper
function normalizeLanguage(lang: string): string {
  const languageMap: Record<string, string> = {
    'rs': 'rust',
    'py': 'python',
    'js': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'jsx': 'javascript',
    'nextjs': 'typescript',
    'next': 'typescript',
    'react': 'typescript',
    'bash': 'shell',
    'sh': 'shell',
    'cpp': 'c++',
    '': 'text'
  };

  return languageMap[lang] || lang;
}
