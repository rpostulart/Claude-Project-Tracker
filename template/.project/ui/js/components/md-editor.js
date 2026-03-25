// Shared markdown editor component with toolbar + preview/source toggle
import { renderMarkdown } from './markdown.js';

export function insertMarkdown(textarea, action) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.substring(start, end);
  let insert = '';
  let cursorOffset = 0;

  switch (action) {
    case 'heading':
      insert = `## ${selected || 'Heading'}`;
      cursorOffset = selected ? insert.length : 3;
      break;
    case 'bold':
      insert = `**${selected || 'bold text'}**`;
      cursorOffset = selected ? insert.length : 2;
      break;
    case 'italic':
      insert = `*${selected || 'italic text'}*`;
      cursorOffset = selected ? insert.length : 1;
      break;
    case 'ul':
      insert = selected
        ? selected.split('\n').map(l => `- ${l}`).join('\n')
        : '- Item 1\n- Item 2\n- Item 3';
      cursorOffset = insert.length;
      break;
    case 'ol':
      insert = selected
        ? selected.split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n')
        : '1. First\n2. Second\n3. Third';
      cursorOffset = insert.length;
      break;
    case 'checklist':
      insert = selected
        ? selected.split('\n').map(l => `- [ ] ${l}`).join('\n')
        : '- [ ] Task 1\n- [ ] Task 2\n- [x] Done task';
      cursorOffset = insert.length;
      break;
    case 'table':
      insert = '| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| Cell     | Cell     | Cell     |';
      cursorOffset = insert.length;
      break;
    case 'code':
      insert = selected
        ? '```\n' + selected + '\n```'
        : '```\ncode here\n```';
      cursorOffset = selected ? insert.length : 4;
      break;
    case 'link':
      insert = selected
        ? `[${selected}](url)`
        : '[link text](https://example.com)';
      cursorOffset = selected ? insert.length - 4 : 1;
      break;
    case 'hr':
      insert = '\n---\n';
      cursorOffset = insert.length;
      break;
  }

  textarea.value = textarea.value.substring(0, start) + insert + textarea.value.substring(end);
  textarea.focus();
  const newPos = start + cursorOffset;
  textarea.setSelectionRange(newPos, newPos);
}

export function insertMarkdownInPreview(editor, action) {
  editor.focus();
  switch (action) {
    case 'heading':
      document.execCommand('formatBlock', false, 'h2');
      break;
    case 'bold':
      document.execCommand('bold');
      break;
    case 'italic':
      document.execCommand('italic');
      break;
    case 'ul':
      document.execCommand('insertUnorderedList');
      break;
    case 'ol':
      document.execCommand('insertOrderedList');
      break;
    case 'checklist':
      document.execCommand('insertHTML', false, '<div class="checkbox">☐ Task item</div>');
      break;
    case 'table':
      document.execCommand('insertHTML', false,
        '<table><thead><tr><th>Column 1</th><th>Column 2</th><th>Column 3</th></tr></thead>' +
        '<tbody><tr><td>Cell</td><td>Cell</td><td>Cell</td></tr></tbody></table>');
      break;
    case 'code':
      document.execCommand('insertHTML', false, '<pre><code>code here</code></pre>');
      break;
    case 'link': {
      const url = prompt('Enter URL:', 'https://');
      if (url) document.execCommand('createLink', false, url);
      break;
    }
    case 'hr':
      document.execCommand('insertHTML', false, '<hr>');
      break;
  }
}

export function htmlToMarkdown(el) {
  const lines = [];
  const walk = (node, isTopLevel) => {
    if (node.nodeType === 3) {
      if (isTopLevel && !node.textContent.trim()) return;
      const text = node.textContent.trim();
      if (text) lines.push(text);
      return;
    }
    if (node.nodeType !== 1) return;
    const tag = node.tagName.toLowerCase();

    switch (tag) {
      case 'h1': lines.push('', `# ${node.textContent.trim()}`); break;
      case 'h2': lines.push('', `## ${node.textContent.trim()}`); break;
      case 'h3': lines.push('', `### ${node.textContent.trim()}`); break;
      case 'h4': lines.push('', `#### ${node.textContent.trim()}`); break;
      case 'h5': lines.push('', `##### ${node.textContent.trim()}`); break;
      case 'h6': lines.push('', `###### ${node.textContent.trim()}`); break;
      case 'p': {
        let text = '';
        for (const child of node.childNodes) {
          if (child.nodeType === 3) text += child.textContent;
          else if (child.tagName === 'STRONG' || child.tagName === 'B') text += `**${child.textContent}**`;
          else if (child.tagName === 'EM' || child.tagName === 'I') text += `*${child.textContent}*`;
          else if (child.tagName === 'CODE') text += '`' + child.textContent + '`';
          else if (child.tagName === 'A') text += `[${child.textContent}](${child.getAttribute('href') || ''})`;
          else text += child.textContent;
        }
        lines.push('', text.trim());
        break;
      }
      case 'ul':
        lines.push('');
        for (const li of node.querySelectorAll(':scope > li')) {
          lines.push(`- ${li.textContent.trim()}`);
        }
        break;
      case 'ol':
        lines.push('');
        Array.from(node.querySelectorAll(':scope > li')).forEach((li, i) => {
          lines.push(`${i + 1}. ${li.textContent.trim()}`);
        });
        break;
      case 'blockquote': lines.push('', `> ${node.textContent.trim()}`); break;
      case 'pre': {
        const code = node.querySelector('code');
        const lang = code?.className?.replace('language-', '') || '';
        lines.push('', '```' + lang);
        lines.push(code ? code.textContent : node.textContent);
        lines.push('```');
        break;
      }
      case 'table': {
        lines.push('');
        const rows = node.querySelectorAll('tr');
        rows.forEach((row, ri) => {
          const cells = Array.from(row.querySelectorAll('th, td')).map(c => c.textContent.trim());
          lines.push('| ' + cells.join(' | ') + ' |');
          if (ri === 0) {
            lines.push('| ' + cells.map(() => '--------').join(' | ') + ' |');
          }
        });
        break;
      }
      case 'hr': lines.push('', '---'); break;
      case 'div': {
        if (node.classList.contains('checkbox')) {
          const checked = node.classList.contains('checked');
          const text = node.textContent.replace(/^[☑☐]\s*/, '').trim();
          lines.push(`- [${checked ? 'x' : ' '}] ${text}`);
        } else {
          for (const child of node.childNodes) walk(child, false);
        }
        break;
      }
      case 'br': lines.push(''); break;
      default:
        for (const child of node.childNodes) walk(child, false);
    }
  };

  for (const child of el.childNodes) walk(child, true);
  // Clean up: collapse consecutive empty lines, strip leading/trailing blanks
  const filtered = [];
  let lastWasEmpty = true; // start true to skip leading blanks
  for (const line of lines) {
    if (line === '') {
      if (!lastWasEmpty) { filtered.push(''); lastWasEmpty = true; }
    } else {
      filtered.push(line);
      lastWasEmpty = false;
    }
  }
  return filtered.join('\n').trim();
}

/**
 * Render a markdown editor HTML block.
 * @param {string} id - Unique prefix for element IDs
 * @param {string} content - Initial markdown content
 * @param {object} opts - { minHeight: string, compact: boolean }
 */
export function editorHTML(id, content, opts = {}) {
  const minHeight = opts.minHeight || '200px';
  const escContent = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  return `
    <div class="md-editor" id="${id}-editor">
      <div class="md-toolbar">
        <div class="md-toolbar-left">
          <button class="md-btn" data-md="heading" title="Heading">H</button>
          <button class="md-btn" data-md="bold" title="Bold"><strong>B</strong></button>
          <button class="md-btn" data-md="italic" title="Italic"><em>I</em></button>
          <span class="md-sep"></span>
          <button class="md-btn" data-md="ul" title="Bullet list">• List</button>
          <button class="md-btn" data-md="ol" title="Numbered list">1. List</button>
          <button class="md-btn" data-md="checklist" title="Checklist">☑ Check</button>
          <span class="md-sep"></span>
          <button class="md-btn" data-md="table" title="Table">⊞ Table</button>
          <button class="md-btn" data-md="code" title="Code block">&lt;/&gt; Code</button>
          <button class="md-btn" data-md="link" title="Link">🔗 Link</button>
          <button class="md-btn" data-md="hr" title="Horizontal rule">― Line</button>
        </div>
        <div class="md-toolbar-right">
          <div class="md-mode-toggle">
            <button class="md-mode-btn active" data-mode="preview">Preview</button>
            <button class="md-mode-btn" data-mode="source">Markdown</button>
          </div>
        </div>
      </div>
      <div class="md-editor-preview description-content" id="${id}-preview" contenteditable="true" style="min-height:${minHeight}">${renderMarkdown(content)}</div>
      <textarea class="description-edit" id="${id}-textarea" style="display:none;min-height:${minHeight}">${escContent}</textarea>
    </div>
  `;
}

/**
 * Initialize a rendered markdown editor, returns controller object.
 * @param {HTMLElement} root - Container element that holds the editor
 * @param {string} id - Same prefix used in editorHTML()
 */
export function initEditor(root, id) {
  const editorEl = root.querySelector(`#${id}-editor`);
  const preview = root.querySelector(`#${id}-preview`);
  const textarea = root.querySelector(`#${id}-textarea`);
  let mode = 'preview'; // 'preview' | 'source'

  function updateModeButtons() {
    editorEl.querySelectorAll('.md-mode-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
  }

  // Mode toggle
  editorEl.querySelectorAll('.md-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.mode === mode) return;
      if (btn.dataset.mode === 'source') {
        textarea.value = htmlToMarkdown(preview);
        mode = 'source';
        preview.style.display = 'none';
        textarea.style.display = '';
        textarea.focus();
      } else {
        preview.innerHTML = renderMarkdown(textarea.value);
        mode = 'preview';
        preview.style.display = '';
        textarea.style.display = 'none';
      }
      updateModeButtons();
    });
  });

  // Toolbar buttons
  editorEl.querySelectorAll('.md-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (mode === 'source') {
        insertMarkdown(textarea, btn.dataset.md);
      } else {
        insertMarkdownInPreview(preview, btn.dataset.md);
      }
    });
  });

  return {
    getMarkdown() {
      if (mode === 'source') return textarea.value;
      return htmlToMarkdown(preview);
    },
    setContent(md) {
      textarea.value = md;
      preview.innerHTML = renderMarkdown(md);
    },
    focus() {
      if (mode === 'source') textarea.focus();
      else preview.focus();
    }
  };
}
