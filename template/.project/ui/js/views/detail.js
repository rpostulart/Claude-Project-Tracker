// Issue detail view
import API from '../api.js';
import { state, navigate, loadData } from '../app.js';
import { renderMarkdown } from '../components/markdown.js';
import { editorHTML, initEditor } from '../components/md-editor.js';

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

const AI_AUTHORS = {
  'claude-code@ai': { name: 'Claude Code', initials: 'AI' },
  'claude@ai': { name: 'Claude', initials: 'AI' },
};

function getInitials(email) {
  if (!email) return '?';
  if (AI_AUTHORS[email]) return AI_AUTHORS[email].initials;
  const name = state.config?.team?.find(m => m.email === email)?.name || email;
  return name.split(/[\s@]/).filter(Boolean).map(p => p[0].toUpperCase()).slice(0, 2).join('');
}

function getName(email) {
  if (!email) return 'Anonymous';
  if (AI_AUTHORS[email]) return AI_AUTHORS[email].name;
  return state.config?.team?.find(m => m.email === email)?.name || email;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}

export async function renderDetail(container, issueId) {
  if (!issueId) {
    navigate('board');
    return;
  }

  const issue = await API.getIssue(issueId);
  if (!issue) {
    container.innerHTML = '<div class="error-message">Issue not found</div>';
    return;
  }

  const statuses = state.config?.statuses || [];
  const types = state.config?.types || [];
  const priorities = state.config?.priorities || [];
  const team = state.config?.team || [];
  const labels = state.config?.labels || [];

  // Find subtasks
  const subtasks = state.issues.filter(i => i.parent === issue.id);

  // Find all related issues (explicit + reverse links)
  const explicitRelated = issue.related || [];
  const reverseRelated = state.issues
    .filter(i => (i.related || []).includes(issue.id) && !explicitRelated.includes(i.id))
    .map(i => i.id);
  const allRelated = [...explicitRelated, ...reverseRelated];

  container.innerHTML = `
    <div class="detail-container">
      <a class="detail-back">← Back to board</a>

      <div class="detail-header">
        <div class="detail-header-top">
          <span class="issue-type ${issue.type}" style="width:24px;height:24px;font-size:13px;">${
            { feature: '★', bug: '●', task: '◆', epic: '⚡' }[issue.type] || '◆'
          }</span>
          <span class="issue-id" style="font-size:14px;">${issue.id}</span>
          ${issue.parent ? `<span class="issue-id" style="font-size:13px;">↳ Parent: <a class="parent-link" data-id="${issue.parent}" style="color:var(--color-accent);cursor:pointer">${issue.parent}</a></span>` : ''}
        </div>
        <input class="detail-title" value="${escapeHtml(issue.title)}" data-field="title">
      </div>

      <div class="detail-meta">
        <div class="meta-field">
          <label>Status</label>
          <select data-field="status">
            ${statuses.map(s => `<option value="${s}" ${issue.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="meta-field">
          <label>Type</label>
          <select data-field="type">
            ${types.map(t => `<option value="${t}" ${issue.type === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="meta-field">
          <label>Priority</label>
          <select data-field="priority">
            ${priorities.map(p => `<option value="${p}" ${issue.priority === p ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
        </div>
        <div class="meta-field">
          <label>Assignee</label>
          <select data-field="assignee">
            <option value="">Unassigned</option>
            ${team.map(m => `<option value="${m.email}" ${issue.assignee === m.email ? 'selected' : ''}>${m.name}</option>`).join('')}
          </select>
        </div>
        <div class="meta-field">
          <label>Created</label>
          <div style="font-size:14px;padding:4px 0">${formatDate(issue.created)}</div>
        </div>
        <div class="meta-field">
          <label>Updated</label>
          <div style="font-size:14px;padding:4px 0">${formatDate(issue.updated)}</div>
        </div>
      </div>

      ${subtasks.length > 0 ? `
        <div class="detail-section">
          <h3>Subtasks</h3>
          <div class="subtask-list">
            ${subtasks.map(st => `
              <div class="subtask-item" data-id="${st.id}">
                <span class="issue-type ${st.type}" style="width:18px;height:18px;font-size:9px;">${
                  { feature: '★', bug: '●', task: '◆', epic: '⚡' }[st.type] || '◆'
                }</span>
                <span class="issue-id">${st.id}</span>
                <span style="flex:1">${escapeHtml(st.title)}</span>
                <span class="status-badge ${st.status}">${st.status}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${allRelated.length > 0 ? `
        <div class="detail-section">
          <h3>Related Issues</h3>
          <div class="subtask-list">
            ${allRelated.map(relId => {
              const rel = state.issues.find(i => i.id === relId);
              if (rel) {
                return `
                  <div class="subtask-item related-link" data-id="${rel.id}">
                    <span class="issue-type ${rel.type}" style="width:18px;height:18px;font-size:9px;">${
                      { feature: '★', bug: '●', task: '◆', epic: '⚡' }[rel.type] || '◆'
                    }</span>
                    <span class="issue-id">${rel.id}</span>
                    <span style="flex:1">${escapeHtml(rel.title)}</span>
                    <span class="status-badge ${rel.status}">${rel.status}</span>
                  </div>`;
              }
              return `
                <div class="subtask-item related-link" data-id="${relId}">
                  <span class="issue-id">${relId}</span>
                </div>`;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <div class="detail-section">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <h3 style="margin-bottom:0">Description</h3>
          <div class="wiki-title-actions-wrapper" style="position:relative;min-width:120px;height:32px;">
            <div class="wiki-title-actions" id="desc-view-actions">
              <button class="btn btn-ghost btn-sm" id="btn-edit-desc">Edit</button>
            </div>
            <div class="wiki-title-actions" id="desc-edit-actions" style="display:none">
              <button class="btn btn-primary btn-sm" id="btn-save-desc">Save</button>
              <button class="btn btn-secondary btn-sm" id="btn-cancel-desc">Cancel</button>
            </div>
          </div>
        </div>
        <div id="description-view" class="description-content">
          ${renderMarkdown(issue.description || '')}
        </div>
        <div id="description-edit" style="display:none">
          ${editorHTML('desc', issue.description || '', { minHeight: '200px' })}
        </div>
      </div>

      <div class="detail-section">
        <h3>Comments (${(issue.comments || []).length})</h3>
        <div class="comments-list">
          ${(issue.comments || []).map(c => {
            if (c.type === 'todo') {
              return `
              <div class="comment todo-item">
                <div class="comment-header">
                  <label class="todo-checkbox-label">
                    <input type="checkbox" class="todo-checkbox" data-comment-id="${c.id}" ${c.done ? 'checked' : ''}>
                  </label>
                  <span class="avatar" style="width:28px;height:28px">${getInitials(c.author)}</span>
                  <span class="comment-author">${getName(c.author)}</span>
                  <span class="comment-date">${formatDate(c.created)}</span>
                </div>
                <div class="comment-body description-content${c.done ? ' todo-done' : ''}">${renderMarkdown(c.content || '')}</div>
              </div>`;
            }
            return `
            <div class="comment">
              <div class="comment-header">
                <span class="avatar" style="width:28px;height:28px">${getInitials(c.author)}</span>
                <span class="comment-author">${getName(c.author)}</span>
                <span class="comment-date">${formatDate(c.created)}</span>
              </div>
              <div class="comment-body description-content">${renderMarkdown(c.content || '')}</div>
            </div>`;
          }).join('')}
        </div>
        <div class="comment-form">
          <div id="comment-editor-wrapper" style="display:none">
            ${editorHTML('comment', '', { minHeight: '100px' })}
          </div>
          <textarea id="comment-input" placeholder="Write a comment..." style="min-height:80px"></textarea>
          <div style="display:flex;gap:8px;margin-top:8px;">
            <button class="btn btn-primary btn-sm" id="btn-add-comment">Add Comment</button>
            <button class="btn btn-secondary btn-sm" id="btn-add-todo">Add Todo</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Event: Back
  container.querySelector('.detail-back').addEventListener('click', () => navigate('board'));

  // Event: Parent link
  const parentLink = container.querySelector('.parent-link');
  if (parentLink) {
    parentLink.addEventListener('click', () => navigate('detail', { issueId: parentLink.dataset.id }));
  }

  // Event: Subtask click
  container.querySelectorAll('.subtask-item').forEach(el => {
    el.addEventListener('click', () => navigate('detail', { issueId: el.dataset.id }));
  });

  // Event: Related issue click
  container.querySelectorAll('.related-link').forEach(el => {
    el.addEventListener('click', () => navigate('detail', { issueId: el.dataset.id }));
  });

  // Event: Inline field updates
  let updateTimeout;
  const saveField = async (field, value) => {
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(async () => {
      try {
        await API.updateIssue(issueId, { [field]: value || null });
        await loadData();
      } catch (e) {
        console.error('Failed to update:', e);
      }
    }, 500);
  };

  container.querySelectorAll('[data-field]').forEach(el => {
    const field = el.dataset.field;
    const event = el.tagName === 'SELECT' ? 'change' : 'blur';
    el.addEventListener(event, () => saveField(field, el.value));
  });

  // Description editor
  const descView = container.querySelector('#description-view');
  const descEditSection = container.querySelector('#description-edit');
  const descViewActions = container.querySelector('#desc-view-actions');
  const descEditActions = container.querySelector('#desc-edit-actions');
  let descEditor = null;

  container.querySelector('#btn-edit-desc').addEventListener('click', () => {
    descView.style.display = 'none';
    descEditSection.style.display = '';
    descViewActions.style.display = 'none';
    descEditActions.style.display = 'flex';
    if (!descEditor) {
      descEditor = initEditor(container, 'desc');
    }
    descEditor.focus();
  });

  container.querySelector('#btn-save-desc').addEventListener('click', async () => {
    const content = descEditor.getMarkdown();
    await API.updateDescription(issueId, content);
    descView.innerHTML = renderMarkdown(content);
    descView.style.display = '';
    descEditSection.style.display = 'none';
    descViewActions.style.display = 'flex';
    descEditActions.style.display = 'none';
  });

  container.querySelector('#btn-cancel-desc').addEventListener('click', () => {
    descView.style.display = '';
    descEditSection.style.display = 'none';
    descViewActions.style.display = 'flex';
    descEditActions.style.display = 'none';
  });

  // Comment editor — switch from plain textarea to rich editor on focus
  const commentInput = container.querySelector('#comment-input');
  const commentEditorWrapper = container.querySelector('#comment-editor-wrapper');
  let commentEditor = null;

  commentInput.addEventListener('focus', () => {
    // Switch to rich editor
    const existingText = commentInput.value;
    commentInput.style.display = 'none';
    commentEditorWrapper.style.display = '';
    if (!commentEditor) {
      commentEditor = initEditor(container, 'comment');
    }
    if (existingText) commentEditor.setContent(existingText);
    commentEditor.focus();
  });

  container.querySelector('#btn-add-comment').addEventListener('click', async () => {
    let content;
    if (commentEditor && commentEditorWrapper.style.display !== 'none') {
      content = commentEditor.getMarkdown();
    } else {
      content = commentInput.value.trim();
    }
    if (!content) return;

    await API.addComment(issueId, { author: state.currentUser || 'anonymous', content });
    if (commentEditor) commentEditor.setContent('');
    commentInput.value = '';
    await loadData();
    await renderDetail(container, issueId);
  });

  // Add Todo button
  container.querySelector('#btn-add-todo').addEventListener('click', async () => {
    let content;
    if (commentEditor && commentEditorWrapper.style.display !== 'none') {
      content = commentEditor.getMarkdown();
    } else {
      content = commentInput.value.trim();
    }
    if (!content) return;

    await API.addComment(issueId, { author: state.currentUser || 'anonymous', content, type: 'todo', done: false });
    if (commentEditor) commentEditor.setContent('');
    commentInput.value = '';
    await loadData();
    await renderDetail(container, issueId);
  });

  // Todo checkbox toggle
  container.querySelectorAll('.todo-checkbox').forEach(cb => {
    cb.addEventListener('change', async () => {
      await API.updateComment(issueId, cb.dataset.commentId, { done: cb.checked });
      await loadData();
      await renderDetail(container, issueId);
    });
  });
}
