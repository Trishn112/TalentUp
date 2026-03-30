
/**
 * Simple code formatter for C-style languages (JS, Java, C++, etc.)
 * Provides basic indentation and alignment.
 */
export function formatCode(code: string): string {
  if (!code) return "";
  
  const lines = code.split('\n');
  let indentLevel = 0;
  const indentSize = 2;
  const result: string[] = [];

  for (let line of lines) {
    let trimmed = line.trim();
    
    // Handle closing braces at the start of the line
    const closingBraces = (trimmed.match(/[}\])]/g) || []).length;
    const openingBraces = (trimmed.match(/[{(\[]/g) || []).length;
    
    // If line starts with a closing brace, decrease indent before processing the line
    if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
      indentLevel = Math.max(0, indentLevel - 1);
    } else if (closingBraces > openingBraces) {
      // More closing than opening on this line, likely closing something
      indentLevel = Math.max(0, indentLevel - (closingBraces - openingBraces));
    }

    result.push(' '.repeat(indentLevel * indentSize) + trimmed);

    // If line ends with an opening brace, or has more opening than closing, increase indent for next line
    if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
      indentLevel++;
    } else if (openingBraces > closingBraces) {
      indentLevel += (openingBraces - closingBraces);
    }
  }

  return result.join('\n');
}

/**
 * Handles smart indentation on Enter key
 */
export function handleSmartIndent(
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  value: string,
  onValueChange: (value: string) => void
) {
  if (e.key === 'Enter') {
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd } = textarea;
    
    // Get the current line
    const linesBefore = value.substring(0, selectionStart).split('\n');
    const currentLine = linesBefore[linesBefore.length - 1];
    
    // Get indentation of current line
    const indentMatch = currentLine.match(/^\s*/);
    const indent = indentMatch ? indentMatch[0] : '';
    
    // Check if we should increase indent (e.g., after {)
    let extraIndent = '';
    if (currentLine.trim().endsWith('{')) {
      extraIndent = '  ';
    }
    
    e.preventDefault();
    const newValue = 
      value.substring(0, selectionStart) + 
      '\n' + indent + extraIndent + 
      value.substring(selectionEnd);
    
    onValueChange(newValue);
    
    // Set cursor position after the new indentation
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = selectionStart + 1 + indent.length + extraIndent.length;
    }, 0);
  }
}
