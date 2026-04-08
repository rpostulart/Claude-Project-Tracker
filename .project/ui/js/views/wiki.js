// Wiki view
import API from '../api.js';
import { state, navigate } from '../app.js';
import { renderMarkdown } from '../components/markdown.js';
import { openModal, closeModal } from '../components/modal.js';
import { htmlToMarkdown, editorHTML, initEditor, insertMarkdown, insertMarkdownInPreview } from '../components/md-editor.js';

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Markdown toolbar helpers now in components/md-editor.js


// Build a tree structure from flat page list
function buildPageTree(pages) {
  const sorted = [...pages].sort((a, b) => (a.order || 0) - (b.order || 0));
  const roots = [];
  const childrenMap = {};

  for (const page of sorted) {
    const parentSlug = page.parent || null;
    if (!parentSlug) {
      roots.push(page);
    } else {
      if (!childrenMap[parentSlug]) childrenMap[parentSlug] = [];
      childrenMap[parentSlug].push(page);
    }
  }

  return { roots, childrenMap };
}

// SVG icons
const ICON_PAGE = `<svg class="wiki-icon" viewBox="0 0 16 16" fill="none"><path d="M4 1h5.5L13 4.5V14a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" stroke="currentColor" stroke-width="1.2"/><path d="M9 1v4h4" stroke="currentColor" stroke-width="1.2"/></svg>`;
const ICON_FOLDER = `<svg class="wiki-icon" viewBox="0 0 16 16" fill="none"><path d="M1.5 3.5h4l1.5 1.5h6.5v8h-12z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
const ICON_CHEVRON_RIGHT = `<svg class="wiki-chevron" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_CHEVRON_DOWN = `<svg class="wiki-chevron" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// Render page tree recursively as HTML
function renderPageTree(pages, childrenMap, activeSlug, depth = 0) {
  if (!pages || pages.length === 0) return '';

  return pages.map(p => {
    const children = childrenMap[p.slug] || [];
    const isActive = p.slug === activeSlug;
    const hasChildren = children.length > 0;
    const indent = depth * 28;

    return `
      <div class="wiki-page-node" data-slug="${p.slug}" draggable="true">
        <div class="wiki-page-link-row" style="padding-left:${indent}px">
          ${hasChildren
            ? `<span class="wiki-tree-toggle" data-slug="${p.slug}">${ICON_CHEVRON_DOWN}</span>`
            : `<span class="wiki-tree-bullet">&bull;</span>`}
          ${hasChildren ? ICON_FOLDER : ICON_PAGE}
          <a class="wiki-page-link ${isActive ? 'active' : ''}" data-slug="${p.slug}">${escapeHtml(p.title)}</a>
          <button class="wiki-page-menu-btn" data-slug="${p.slug}" title="Page actions">&#x2026;</button>
        </div>
        ${hasChildren ? `<div class="wiki-children" data-parent="${p.slug}">
          ${renderPageTree(children, childrenMap, activeSlug, depth + 1)}
        </div>` : ''}
      </div>
    `;
  }).join('');
}

// Find breadcrumb path from root to current page
function getBreadcrumbs(pages, slug) {
  if (!slug) return [];
  const pageMap = {};
  for (const p of pages) pageMap[p.slug] = p;

  const trail = [];
  let current = pageMap[slug];
  while (current) {
    trail.unshift(current);
    current = current.parent ? pageMap[current.parent] : null;
  }
  return trail;
}

// Strip leading # Title from content since title is shown separately
function stripLeadingTitle(content, title) {
  if (!content) return '';
  // Remove first line if it's a # heading matching the title
  const lines = content.split('\n');
  if (lines[0] && lines[0].match(/^#\s+/) && lines[0].replace(/^#\s+/, '').trim() === title.trim()) {
    lines.shift();
    // Remove leading blank line after title
    while (lines.length && lines[0].trim() === '') lines.shift();
  }
  return lines.join('\n');
}

export async function renderWiki(container, slug) {
  const index = await API.getWikiIndex();
  const pages = (index.pages || []).sort((a, b) => (a.order || 0) - (b.order || 0));
  const { roots, childrenMap } = buildPageTree(pages);

  // If no slug and pages exist, default to first root page
  if (!slug && roots.length > 0) {
    slug = roots[0].slug;
  }

  let currentPage = null;
  if (slug) {
    try {
      currentPage = await API.getWikiPage(slug);
    } catch { /* page doesn't exist */ }
  }

  const breadcrumbs = getBreadcrumbs(pages, slug);
  const currentEntry = pages.find(p => p.slug === slug);

  container.innerHTML = `
    <div class="wiki-container">
      <div class="wiki-sidebar" id="wiki-sidebar">
        <input type="text" class="wiki-search" id="wiki-search" placeholder="Search pages...">
        <div id="wiki-search-results" style="display:none"></div>
        <div id="wiki-tree-section">
          <h3>Pages</h3>
          <div class="wiki-page-list">
            ${renderPageTree(roots, childrenMap, slug)}
          </div>
          <button class="btn btn-ghost btn-sm" id="btn-new-page" style="margin-top:12px;width:100%">+ New Page</button>
        </div>
      </div>
      <div class="wiki-resize-handle" id="wiki-resize-handle"></div>
      <div class="wiki-content">
        ${currentPage ? `
          ${breadcrumbs.length > 1 ? `
            <div class="wiki-breadcrumbs">
              ${breadcrumbs.map((b, i) =>
                i < breadcrumbs.length - 1
                  ? `<a class="wiki-breadcrumb" data-slug="${b.slug}">${escapeHtml(b.title)}</a><span class="wiki-breadcrumb-sep">/</span>`
                  : ``
              ).join('')}
            </div>
          ` : ''}
          <div class="wiki-title-row">
            <input type="text" class="wiki-title-input" id="wiki-title-input" value="${escapeHtml(currentPage.title)}" placeholder="Page title" />
            <div class="wiki-title-actions-wrapper">
              <div class="wiki-title-actions" id="wiki-title-actions">
                <button class="btn btn-ghost btn-sm" id="btn-copy-wiki">Copy</button>
                <button class="btn btn-ghost btn-sm" id="btn-edit-wiki">Edit</button>
                <button class="btn btn-ghost btn-sm wiki-btn-danger" id="btn-delete-wiki">Delete</button>
              </div>
              <div class="wiki-title-actions" id="wiki-edit-actions" style="display:none">
                <button class="btn btn-primary btn-sm" id="btn-save-wiki">Save</button>
                <button class="btn btn-secondary btn-sm" id="btn-cancel-wiki">Cancel</button>
              </div>
            </div>
          </div>
          <div class="wiki-body-section">
            <div id="wiki-view" class="description-content">
              ${renderMarkdown(stripLeadingTitle(currentPage.content, currentPage.title))}
            </div>
            <div id="wiki-edit" style="display:none">
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
                    <button class="md-mode-btn active" id="btn-mode-preview">Preview</button>
                    <button class="md-mode-btn" id="btn-mode-source">Markdown</button>
                  </div>
                </div>
              </div>
              <div id="wiki-edit-preview" class="wiki-edit-preview description-content" contenteditable="true"></div>
              <textarea class="description-edit" id="wiki-textarea" style="display:none;min-height:400px">${escapeHtml(stripLeadingTitle(currentPage.content, currentPage.title))}</textarea>
            </div>
          </div>
        ` : `
          <div class="wiki-empty">
            <p>${pages.length === 0 ? 'No wiki pages yet.' : 'Select a page from the sidebar.'}</p>
            ${pages.length === 0 ? '<button class="btn btn-primary" id="btn-new-page-empty">Create First Page</button>' : ''}
          </div>
        `}
      </div>
    </div>
  `;

  // Event: Page navigation
  container.querySelectorAll('.wiki-page-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.stopPropagation();
      state.currentWikiSlug = link.dataset.slug;
      navigate('wiki', { slug: link.dataset.slug });
    });
  });

  // Event: Breadcrumb navigation
  container.querySelectorAll('.wiki-breadcrumb').forEach(link => {
    link.addEventListener('click', () => {
      navigate('wiki', { slug: link.dataset.slug });
    });
  });

  // Event: Toggle children visibility
  container.querySelectorAll('.wiki-tree-toggle').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const childrenEl = container.querySelector(`.wiki-children[data-parent="${toggle.dataset.slug}"]`);
      if (childrenEl) {
        const collapsed = childrenEl.style.display === 'none';
        childrenEl.style.display = collapsed ? '' : 'none';
        toggle.innerHTML = collapsed ? ICON_CHEVRON_DOWN : ICON_CHEVRON_RIGHT;
      }
    });
  });

  // Event: Wiki page editing
  if (currentPage) {
    const wikiView = container.querySelector('#wiki-view');
    const wikiEdit = container.querySelector('#wiki-edit');
    const textarea = container.querySelector('#wiki-textarea');
    const editPreview = container.querySelector('#wiki-edit-preview');
    const btnEdit = container.querySelector('#btn-edit-wiki');
    const titleInput = container.querySelector('#wiki-title-input');
    const wikiContent = container.querySelector('.wiki-content');
    const bodyContent = stripLeadingTitle(currentPage.content, currentPage.title);
    let isEditing = false;
    let editMode = 'preview'; // 'preview' or 'source'

    // Title: save on blur or Enter
    const saveTitle = async () => {
      const newTitle = titleInput.value.trim();
      if (newTitle && newTitle !== currentPage.title) {
        const content = isEditing ? getEditorContent() : bodyContent;
        await API.saveWikiPage(slug, { title: newTitle, content });
        currentPage.title = newTitle;
        const sidebarLink = container.querySelector(`.wiki-page-link[data-slug="${slug}"]`);
        if (sidebarLink) sidebarLink.textContent = newTitle;
      }
    };
    titleInput.addEventListener('blur', saveTitle);
    titleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); titleInput.blur(); }
    });

    function getEditorContent() {
      if (editMode === 'source') return textarea.value;
      // Convert preview HTML back to markdown
      return htmlToMarkdown(editPreview);
    }

    // Copy button — copies raw markdown to clipboard
    container.querySelector('#btn-copy-wiki').addEventListener('click', async (e) => {
      const markdown = `# ${currentPage.title}\n\n${bodyContent}`;
      try {
        await navigator.clipboard.writeText(markdown);
        const btn = e.target;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
      } catch {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = `# ${currentPage.title}\n\n${bodyContent}`;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        const btn = e.target;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
      }
    });

    const viewActions = container.querySelector('#wiki-title-actions');
    const editActions = container.querySelector('#wiki-edit-actions');

    function enterEditMode() {
      isEditing = true;
      wikiView.style.display = 'none';
      wikiEdit.style.display = '';
      viewActions.style.display = 'none';
      editActions.style.display = 'flex';
      wikiContent.classList.add('wiki-content--editing');
      // Initialize preview editor
      editPreview.innerHTML = renderMarkdown(textarea.value);
      editPreview.style.display = '';
      textarea.style.display = 'none';
      editMode = 'preview';
      updateModeButtons();
      editPreview.focus();
    }

    function exitEditMode() {
      isEditing = false;
      wikiView.style.display = '';
      wikiEdit.style.display = 'none';
      viewActions.style.display = 'flex';
      editActions.style.display = 'none';
      wikiContent.classList.remove('wiki-content--editing');
    }

    function updateModeButtons() {
      const btnPreview = container.querySelector('#btn-mode-preview');
      const btnSource = container.querySelector('#btn-mode-source');
      btnPreview.classList.toggle('active', editMode === 'preview');
      btnSource.classList.toggle('active', editMode === 'source');
    }

    // Enter edit mode
    btnEdit.addEventListener('click', enterEditMode);

    // Mode toggle: Preview <-> Markdown
    container.querySelector('#btn-mode-preview').addEventListener('click', () => {
      if (editMode === 'preview') return;
      editMode = 'preview';
      editPreview.innerHTML = renderMarkdown(textarea.value);
      editPreview.style.display = '';
      textarea.style.display = 'none';
      updateModeButtons();
    });

    container.querySelector('#btn-mode-source').addEventListener('click', () => {
      if (editMode === 'source') return;
      // Sync preview back to textarea
      textarea.value = htmlToMarkdown(editPreview);
      editMode = 'source';
      editPreview.style.display = 'none';
      textarea.style.display = '';
      textarea.focus();
      updateModeButtons();
    });

    // Save
    container.querySelector('#btn-save-wiki').addEventListener('click', async () => {
      const content = getEditorContent();
      const title = titleInput.value.trim() || currentPage.title;
      await API.saveWikiPage(slug, { title, content });
      wikiView.innerHTML = renderMarkdown(content);
      currentPage.content = content;
      exitEditMode();
    });

    // Cancel
    container.querySelector('#btn-cancel-wiki').addEventListener('click', () => {
      textarea.value = bodyContent;
      wikiView.innerHTML = renderMarkdown(bodyContent);
      exitEditMode();
    });

    // Markdown toolbar — works in both modes
    container.querySelectorAll('.md-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.md;
        if (editMode === 'source') {
          insertMarkdown(textarea, action);
        } else {
          // In preview mode, insert via execCommand or direct HTML
          insertMarkdownInPreview(editPreview, action);
        }
      });
    });

    // Delete — promote children to deleted page's parent
    container.querySelector('#btn-delete-wiki').addEventListener('click', async () => {
      const children = childrenMap[slug] || [];
      const msg = children.length > 0
        ? `Delete "${currentPage.title}"? Its ${children.length} subpage(s) will be moved up.`
        : `Delete wiki page "${currentPage.title}"?`;
      if (confirm(msg)) {
        // Move children to deleted page's parent
        const deletedEntry = pages.find(p => p.slug === slug);
        const newParent = deletedEntry?.parent || null;
        for (const child of children) {
          const childPage = await API.getWikiPage(child.slug);
          await API.saveWikiPage(child.slug, { title: child.title, content: childPage?.content || '', parent: newParent });
        }
        await API.deleteWikiPage(slug);
        navigate('wiki');
      }
    });

    // Auto-enter edit mode for new pages
    if (bodyContent.trim() === 'Start writing here...' || bodyContent.trim() === '') {
      setTimeout(enterEditMode, 100);
    }
  }

  // Event: Drag and drop to reparent pages
  let draggedSlug = null;
  container.querySelectorAll('.wiki-page-node[draggable]').forEach(node => {
    node.addEventListener('dragstart', (e) => {
      e.stopPropagation();
      draggedSlug = node.dataset.slug;
      node.classList.add('wiki-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', draggedSlug);
    });

    node.addEventListener('dragend', () => {
      node.classList.remove('wiki-dragging');
      container.querySelectorAll('.wiki-drop-target, .wiki-drop-above, .wiki-drop-below').forEach(el => {
        el.classList.remove('wiki-drop-target', 'wiki-drop-above', 'wiki-drop-below');
      });
      draggedSlug = null;
    });

    const linkRow = node.querySelector('.wiki-page-link-row');
    linkRow.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (node.dataset.slug === draggedSlug) return;
      // Determine drop zone: above, on (as child), or below
      const rect = linkRow.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const zone = y < rect.height * 0.25 ? 'above' : y > rect.height * 0.75 ? 'below' : 'on';
      linkRow.classList.remove('wiki-drop-target', 'wiki-drop-above', 'wiki-drop-below');
      if (zone === 'on') linkRow.classList.add('wiki-drop-target');
      else if (zone === 'above') linkRow.classList.add('wiki-drop-above');
      else linkRow.classList.add('wiki-drop-below');
      e.dataTransfer.dropEffect = 'move';
    });

    linkRow.addEventListener('dragleave', () => {
      linkRow.classList.remove('wiki-drop-target', 'wiki-drop-above', 'wiki-drop-below');
    });

    linkRow.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      linkRow.classList.remove('wiki-drop-target', 'wiki-drop-above', 'wiki-drop-below');
      const sourceSlug = e.dataTransfer.getData('text/plain');
      const targetSlug = node.dataset.slug;
      if (!sourceSlug || sourceSlug === targetSlug) return;

      // Don't allow dropping on own descendants
      const isDescendant = (parentSlug, childSlug) => {
        const kids = childrenMap[parentSlug] || [];
        for (const k of kids) {
          if (k.slug === childSlug) return true;
          if (isDescendant(k.slug, childSlug)) return true;
        }
        return false;
      };
      if (isDescendant(sourceSlug, targetSlug)) return;

      const rect = linkRow.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const zone = y < rect.height * 0.25 ? 'above' : y > rect.height * 0.75 ? 'below' : 'on';

      const sourcePage = await API.getWikiPage(sourceSlug);
      const sourceEntry = pages.find(p => p.slug === sourceSlug);
      const targetEntry = pages.find(p => p.slug === targetSlug);

      if (zone === 'on') {
        // Make source a child of target
        await API.saveWikiPage(sourceSlug, { title: sourceEntry.title, content: sourcePage?.content || '', parent: targetSlug });
      } else {
        // Place source as sibling of target (same parent)
        const newParent = targetEntry?.parent || null;
        await API.saveWikiPage(sourceSlug, { title: sourceEntry.title, content: sourcePage?.content || '', parent: newParent });
      }
      navigate('wiki', { slug: slug });
    });
  });

  // Drop on sidebar root area to make top-level
  const pageList = container.querySelector('.wiki-page-list');
  if (pageList) {
    pageList.addEventListener('dragover', (e) => {
      // Only handle if dragging over empty space (not over a node)
      if (e.target === pageList || e.target === pageList.parentElement) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }
    });
    pageList.addEventListener('drop', async (e) => {
      if (e.target !== pageList && e.target !== pageList.parentElement) return;
      e.preventDefault();
      const sourceSlug = e.dataTransfer.getData('text/plain');
      if (!sourceSlug) return;
      const sourcePage = await API.getWikiPage(sourceSlug);
      const sourceEntry = pages.find(p => p.slug === sourceSlug);
      await API.saveWikiPage(sourceSlug, { title: sourceEntry.title, content: sourcePage?.content || '', parent: null });
      navigate('wiki', { slug: slug });
    });
  }

  // Event: Three-dot menu on sidebar pages
  let openMenu = null;
  function closeOpenMenu() {
    if (openMenu) { openMenu.remove(); openMenu = null; }
  }
  document.addEventListener('click', closeOpenMenu);

  container.querySelectorAll('.wiki-page-menu-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeOpenMenu();

      const pageSlug = btn.dataset.slug;
      const pageEntry = pages.find(p => p.slug === pageSlug);
      const menu = document.createElement('div');
      menu.className = 'wiki-page-menu';
      menu.innerHTML = `
        <button class="wiki-page-menu-item" data-action="add-child">Add subpage</button>
        <button class="wiki-page-menu-item" data-action="rename">Rename</button>
        <button class="wiki-page-menu-item wiki-page-menu-item--danger" data-action="delete">Delete</button>
      `;

      // Position below the button
      const rect = btn.getBoundingClientRect();
      menu.style.position = 'fixed';
      menu.style.top = (rect.bottom + 4) + 'px';
      menu.style.left = rect.left + 'px';
      document.body.appendChild(menu);
      openMenu = menu;

      menu.addEventListener('click', async (ev) => {
        ev.stopPropagation();
        const action = ev.target.dataset.action;
        if (!action) return;
        closeOpenMenu();

        if (action === 'add-child') {
          // Use setTimeout to ensure modal opens after menu click event fully resolves
          setTimeout(() => showNewPageModal(pageSlug), 0);
          return;
        } else if (action === 'rename') {
          setTimeout(() => {
            openModal('Rename Page', `
              <div class="form-group">
                <label>New Title</label>
                <input type="text" id="wiki-rename-title" value="${escapeHtml(pageEntry?.title || '')}">
              </div>
            `, {
              saveLabel: 'Rename',
              onSave: async (overlay) => {
                const newTitle = overlay.querySelector('#wiki-rename-title').value.trim();
                if (!newTitle || newTitle === pageEntry?.title) return;
                try {
                  const pageData = await API.getWikiPage(pageSlug);
                  await API.saveWikiPage(pageSlug, { title: newTitle, content: pageData.content });
                } catch {
                  await API.saveWikiPage(pageSlug, { title: newTitle, content: '' });
                }
                closeModal();
                navigate('wiki', { slug: pageSlug });
              }
            });
          }, 0);
          return;
        } else if (action === 'delete') {
          const children = childrenMap[pageSlug] || [];
          const msg = children.length > 0
            ? `Delete "${pageEntry?.title}"? Its ${children.length} subpage(s) will be moved up.`
            : `Delete wiki page "${pageEntry?.title}"?`;
          if (confirm(msg)) {
            const deletedEntry = pages.find(p => p.slug === pageSlug);
            const newParent = deletedEntry?.parent || null;
            for (const child of children) {
              const childPage = await API.getWikiPage(child.slug);
              await API.saveWikiPage(child.slug, { title: child.title, content: childPage?.content || '', parent: newParent });
            }
            await API.deleteWikiPage(pageSlug);
            navigate('wiki');
          }
        }
      });
    });
  });

  function showNewPageModal(parentSlug = null) {
    const parentLabel = parentSlug
      ? pages.find(p => p.slug === parentSlug)?.title || parentSlug
      : null;

    openModal('New Wiki Page', `
      <div class="form-group">
        <label>Page Title</label>
        <input type="text" id="wiki-new-title" placeholder="e.g. Deployment Guide">
      </div>
      ${parentLabel ? `<div class="form-group"><label>Parent</label><div style="font-size:14px;color:var(--color-text-secondary)">${escapeHtml(parentLabel)}</div></div>` : `
        <div class="form-group">
          <label>Parent Page (optional)</label>
          <select id="wiki-new-parent">
            <option value="">None (top-level)</option>
            ${pages.map(p => `<option value="${p.slug}">${escapeHtml(p.title)}</option>`).join('')}
          </select>
        </div>
      `}
    `, {
      saveLabel: 'Create',
      onSave: async (overlay) => {
        const title = overlay.querySelector('#wiki-new-title').value.trim();
        if (!title) return;
        const newSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const parent = parentSlug || overlay.querySelector('#wiki-new-parent')?.value || null;
        await API.saveWikiPage(newSlug, {
          title,
          content: `Start writing here...`,
          parent,
        });
        closeModal();
        navigate('wiki', { slug: newSlug });
      }
    });
  }

  // Event: New top-level page
  const btnNewPage = container.querySelector('#btn-new-page');
  if (btnNewPage) btnNewPage.addEventListener('click', () => showNewPageModal(null));

  const btnNewPageEmpty = container.querySelector('#btn-new-page-empty');
  if (btnNewPageEmpty) btnNewPageEmpty.addEventListener('click', () => showNewPageModal(null));

  // Wiki search
  const searchInput = container.querySelector('#wiki-search');
  const searchResults = container.querySelector('#wiki-search-results');
  const treeSection = container.querySelector('#wiki-tree-section');
  let searchTimeout;

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const query = searchInput.value.trim();

    if (!query) {
      searchResults.style.display = 'none';
      treeSection.style.display = '';
      return;
    }

    searchTimeout = setTimeout(async () => {
      const { results } = await API.searchWiki(query);
      treeSection.style.display = 'none';
      searchResults.style.display = '';
      searchResults.innerHTML = results.length === 0
        ? '<div class="wiki-search-empty">No results found</div>'
        : results.map(r => `
          <a class="wiki-search-result" data-slug="${r.slug}">
            <div class="wiki-search-result-title">${escapeHtml(r.title)}</div>
            <div class="wiki-search-result-snippet">${escapeHtml(r.snippet)}</div>
          </a>
        `).join('');

      searchResults.querySelectorAll('.wiki-search-result').forEach(el => {
        el.addEventListener('click', () => {
          searchInput.value = '';
          searchResults.style.display = 'none';
          treeSection.style.display = '';
          navigate('wiki', { slug: el.dataset.slug });
        });
      });
    }, 200);
  });

  // Sidebar resize handle
  const resizeHandle = container.querySelector('#wiki-resize-handle');
  const sidebar = container.querySelector('#wiki-sidebar');
  const wikiContainer = container.querySelector('.wiki-container');
  if (resizeHandle && sidebar) {
    let startX, startWidth;
    resizeHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      startX = e.clientX;
      startWidth = sidebar.offsetWidth;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      const onMouseMove = (e) => {
        const newWidth = Math.max(180, Math.min(600, startWidth + (e.clientX - startX)));
        wikiContainer.style.gridTemplateColumns = `${newWidth}px 6px 1fr`;
        sidebar.style.width = newWidth + 'px';
      };

      const onMouseUp = () => {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }
}
