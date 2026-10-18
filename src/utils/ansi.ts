/**
 * Lightweight ANSI escape sequence parser to colored HTML
 */
export function ansiToHtml(text: string): string {
  if (!text) return '';

  // Escape HTML characters first
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Colors mapping
  const colors: Record<string, string> = {
    '30': 'color: #64748b;', // black/muted
    '31': 'color: #ef4444;', // red
    '32': 'color: #22c55e;', // green
    '33': 'color: #eab308;', // yellow
    '34': 'color: #3b82f6;', // blue
    '35': 'color: #d946ef;', // magenta
    '36': 'color: #06b6d4;', // cyan
    '37': 'color: #f1f5f9;', // white
    '90': 'color: #94a3b8;', // bright black
    '91': 'color: #f87171;', // bright red
    '92': 'color: #4ade80;', // bright green
    '93': 'color: #fde047;', // bright yellow
    '94': 'color: #60a5fa;', // bright blue
    '95': 'color: #e879f9;', // bright magenta
    '96': 'color: #22d3ee;', // bright cyan
    '97': 'color: #ffffff;', // bright white
    '1': 'font-weight: 600;', // bold
    '2': 'opacity: 0.7;', // dim
    '4': 'text-decoration: underline;', // underline
  };

  // Convert ANSI escape codes: \x1b[...m
  html = html.replace(/\x1b\[([0-9;]+)m/g, (_match, codesStr) => {
    if (codesStr === '0') {
      return '</span>';
    }
    const codes = codesStr.split(';');
    const styles: string[] = [];
    for (const code of codes) {
      if (colors[code]) {
        styles.push(colors[code]);
      }
    }
    if (styles.length > 0) {
      return `</span><span style="${styles.join(' ')}">`;
    }
    return '';
  });

  // Strip remaining unhandled control characters like cursor movement
  html = html.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');

  return html;
}
