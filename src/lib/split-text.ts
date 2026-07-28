export type SplitMode = 'chars' | 'words';

export type SplitResult = {
  words: HTMLElement[];
  chars: HTMLElement[];
  restore: () => void;
};

function wrapTextNodes(el: HTMLElement, mode: SplitMode): SplitResult {
  const originalHTML = el.innerHTML;
  const text = el.textContent ?? '';

  el.setAttribute('aria-label', text);
  el.setAttribute('role', 'text');

  const words: HTMLElement[] = [];
  const chars: HTMLElement[] = [];
  const fragment = document.createDocumentFragment();

  const parts = text.split(/(\s+)/);

  for (const part of parts) {
    if (!part) continue;

    if (/^\s+$/.test(part)) {
      fragment.appendChild(document.createTextNode(part));
      continue;
    }

    const word = document.createElement('span');
    word.className = 'split-word';
    word.style.display = 'inline-block';
    word.style.whiteSpace = 'nowrap';

    if (mode === 'chars') {
      const mask = document.createElement('span');
      mask.className = 'split-mask';
      mask.style.display = 'inline-block';
      // Visible — overflow:hidden clips blur/rotateX reveals (set clip via CSS when needed)
      mask.style.overflow = 'visible';
      mask.style.verticalAlign = 'bottom';

      for (const char of [...part]) {
        const charEl = document.createElement('span');
        charEl.className = 'split-char';
        charEl.style.display = 'inline-block';
        charEl.style.willChange = 'transform, opacity, filter';
        charEl.textContent = char === ' ' ? '\u00A0' : char;
        chars.push(charEl);
        mask.appendChild(charEl);
      }

      word.appendChild(mask);
    } else {
      const mask = document.createElement('span');
      mask.className = 'split-mask';
      mask.style.display = 'inline-block';
      mask.style.overflow = 'hidden';
      mask.style.verticalAlign = 'bottom';
      mask.style.paddingBottom = '0.12em';
      mask.style.marginBottom = '-0.12em';

      const inner = document.createElement('span');
      inner.className = 'split-word-inner';
      inner.style.display = 'inline-block';
      inner.style.willChange = 'transform, opacity';
      inner.textContent = part;
      mask.appendChild(inner);
      word.appendChild(mask);
      words.push(inner);
    }

    if (mode === 'chars') words.push(word);
    fragment.appendChild(word);
  }

  el.textContent = '';
  el.appendChild(fragment);

  return {
    words,
    chars,
    restore: () => {
      el.innerHTML = originalHTML;
      el.removeAttribute('aria-label');
      el.removeAttribute('role');
    },
  };
}

/** Split element text into words or characters. Call restore() on cleanup. */
export function splitText(el: HTMLElement | null, mode: SplitMode = 'chars'): SplitResult | null {
  if (!el) return null;
  return wrapTextNodes(el, mode);
}
