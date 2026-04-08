// Main application - router and state management
import API from './api.js';
import { renderBoard } from './views/board.js';
import { renderList } from './views/list.js';
import { renderDetail } from './views/detail.js';
import { renderWiki } from './views/wiki.js';
import { renderSkills } from './views/skills.js';
import { renderTodos } from './views/todos.js';
import { openModal, closeModal } from './components/modal.js';

// App state
export const state = {
  config: null,
  issues: [],
  boards: [],
  currentView: 'board',
  currentIssueId: null,
  currentWikiSlug: null,
  currentUser: null, // email from PROJECT_USER env var
};

// Load all data
export async function loadData() {
  const [config, issues, boards, me] = await Promise.all([
    API.getConfig(),
    API.listIssues(),
    API.getBoards(),
    API.getMe(),
  ]);
  state.config = config;
  state.issues = issues;
  state.boards = boards;
  state.currentUser = me.email || null;
}

// Router
export function navigate(view, params = {}) {
  state.currentView = view;
  state.currentIssueId = params.issueId || null;
  state.currentWikiSlug = params.slug || null;

  // Update URL without reload
  const url = view === 'detail' ? `/issue/${params.issueId}`
    : view === 'wiki' && params.slug ? `/wiki/${params.slug}`
    : `/${view === 'board' ? '' : view}`;
  history.pushState({ view, ...params }, '', url);

  render();
  updateNav();
}

function updateNav() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.view === state.currentView ||
      (link.dataset.view === 'board' && state.currentView === 'detail'));
  });
}

// Main render
export async function render() {
  const main = document.getElementById('main');
  main.innerHTML = '<div class="loading">Loading...</div>';

  try {
    switch (state.currentView) {
      case 'board':
        await renderBoard(main);
        break;
      case 'list':
        await renderList(main);
        break;
      case 'detail':
        await renderDetail(main, state.currentIssueId);
        break;
      case 'wiki':
        await renderWiki(main, state.currentWikiSlug);
        break;
      case 'skills':
        await renderSkills(main);
        break;
      case 'todos':
        await renderTodos(main);
        break;
    }
  } catch (e) {
    main.innerHTML = `<div class="error-message">Error: ${e.message}</div>`;
    console.error(e);
  }
}

// Initialize
async function init() {
  await loadData();

  // Set up navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(link.dataset.view);
    });
  });

  // Handle browser back/forward
  window.addEventListener('popstate', (e) => {
    if (e.state) {
      state.currentView = e.state.view;
      state.currentIssueId = e.state.issueId || null;
      state.currentWikiSlug = e.state.slug || null;
      render();
      updateNav();
    }
  });

  // Parse initial URL
  const path = location.pathname;
  if (path.startsWith('/issue/')) {
    state.currentView = 'detail';
    state.currentIssueId = path.split('/issue/')[1];
  } else if (path.startsWith('/wiki')) {
    state.currentView = 'wiki';
    state.currentWikiSlug = path.split('/wiki/')[1] || null;
  } else if (path === '/list') {
    state.currentView = 'list';
  } else if (path === '/skills') {
    state.currentView = 'skills';
  } else if (path === '/todos') {
    state.currentView = 'todos';
  }

  // Update project name in header
  const projectName = document.getElementById('project-name');
  if (projectName && state.config) {
    projectName.textContent = state.config.name;
  }

  // Create issue button
  document.getElementById('btn-create-issue').addEventListener('click', () => {
    const types = state.config?.types || [];
    const priorities = state.config?.priorities || [];
    const team = state.config?.team || [];
    const labels = state.config?.labels || [];

    openModal('New Issue', `
      <div class="form-group">
        <label>Title</label>
        <input type="text" id="new-title" placeholder="Issue title" autofocus>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div class="form-group">
          <label>Type</label>
          <select id="new-type">
            ${types.map(t => `<option value="${t}" ${t === 'task' ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Priority</label>
          <select id="new-priority">
            ${priorities.map(p => `<option value="${p}" ${p === 'medium' ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Assignee</label>
          <select id="new-assignee">
            <option value="">Unassigned</option>
            ${team.map(m => `<option value="${m.email}">${m.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Parent Issue (optional)</label>
          <select id="new-parent">
            <option value="">None</option>
            ${state.issues.map(i => `<option value="${i.id}">${i.id}: ${i.title}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Labels</label>
        <div id="new-labels" style="display:flex;flex-wrap:wrap;gap:8px;">
          ${labels.map(l => `
            <label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer;">
              <input type="checkbox" value="${l}"> ${l}
            </label>
          `).join('')}
        </div>
      </div>
      <div class="form-group">
        <label>Description (Markdown)</label>
        <textarea id="new-description" placeholder="Describe the issue..." style="min-height:120px"></textarea>
      </div>
    `, {
      saveLabel: 'Create Issue',
      onSave: async (overlay) => {
        const title = overlay.querySelector('#new-title').value.trim();
        if (!title) { overlay.querySelector('#new-title').focus(); return; }

        const selectedLabels = Array.from(overlay.querySelectorAll('#new-labels input:checked')).map(cb => cb.value);

        const issue = await API.createIssue({
          title,
          type: overlay.querySelector('#new-type').value,
          priority: overlay.querySelector('#new-priority').value,
          assignee: overlay.querySelector('#new-assignee').value || null,
          parent: overlay.querySelector('#new-parent').value || null,
          labels: selectedLabels,
          description: overlay.querySelector('#new-description').value,
        });

        closeModal();
        await loadData();
        navigate('detail', { issueId: issue.id });
      }
    });
  });

  render();
  updateNav();
}

init();
