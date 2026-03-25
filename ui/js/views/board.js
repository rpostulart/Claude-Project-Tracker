// Kanban board view
import API from '../api.js';
import { state, navigate, loadData, render } from '../app.js';

function getTypeIcon(type) {
  const icons = { feature: '★', bug: '●', task: '◆', epic: '⚡' };
  return icons[type] || '◆';
}

function getInitials(email) {
  if (!email) return '?';
  const name = state.config?.team?.find(m => m.email === email)?.name || email;
  return name.split(/[\s@]/).filter(Boolean).map(p => p[0].toUpperCase()).slice(0, 2).join('');
}

function createCard(issue) {
  const card = document.createElement('div');
  card.className = 'issue-card';
  card.draggable = true;
  card.dataset.issueId = issue.id;

  card.innerHTML = `
    <div class="issue-card-header">
      <span class="issue-type ${issue.type}" title="${issue.type}">${getTypeIcon(issue.type)}</span>
      <span class="issue-id">${issue.id}</span>
      ${issue.parent ? `<span class="issue-id">↳ ${issue.parent}</span>` : ''}
    </div>
    <div class="issue-card-title">${escapeHtml(issue.title)}</div>
    <div class="issue-card-footer">
      <div class="issue-labels">
        ${(issue.labels || []).map(l => `<span class="label-tag">${l}</span>`).join('')}
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span class="priority-dot ${issue.priority}" title="${issue.priority}"></span>
        ${issue.assignee ? `<span class="avatar" title="${issue.assignee}">${getInitials(issue.assignee)}</span>` : ''}
      </div>
    </div>
  `;

  // Click to open detail
  card.addEventListener('click', () => navigate('detail', { issueId: issue.id }));

  // Drag events
  card.addEventListener('dragstart', (e) => {
    card.classList.add('dragging');
    e.dataTransfer.setData('text/plain', issue.id);
    e.dataTransfer.effectAllowed = 'move';
  });

  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
  });

  return card;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

let doneFilter = 'today'; // 'today', 'yesterday', 'week', 'month', 'all'

function filterDoneIssues(issues, filter) {
  if (filter === 'all') return issues;
  const now = new Date();
  let cutoff;
  switch (filter) {
    case 'today':
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'yesterday':
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      break;
    case 'week':
      cutoff = new Date(now - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    default:
      return issues;
  }
  return issues.filter(i => new Date(i.updated || i.created) >= cutoff);
}

export async function renderBoard(container) {
  const board = state.boards[0] || { columns: state.config.statuses.map(s => ({ status: s, title: s })) };
  const issues = state.issues;

  const boardEl = document.createElement('div');
  boardEl.className = 'board';

  for (const col of board.columns) {
    const isDone = col.status === 'done';
    let colIssues = issues.filter(i => i.status === col.status);
    const totalDone = colIssues.length;
    if (isDone) colIssues = filterDoneIssues(colIssues, doneFilter);

    const column = document.createElement('div');
    column.className = 'board-column';
    column.dataset.status = col.status;

    column.innerHTML = `
      <div class="column-header">
        <span>${col.title}</span>
        <span class="column-count">${colIssues.length}${isDone && doneFilter !== 'all' ? ` / ${totalDone}` : ''}</span>
      </div>
      ${isDone ? `
        <div class="done-filter">
          <button class="done-filter-btn ${doneFilter === 'today' ? 'active' : ''}" data-filter="today">Today</button>
          <button class="done-filter-btn ${doneFilter === 'yesterday' ? 'active' : ''}" data-filter="yesterday">Yesterday</button>
          <button class="done-filter-btn ${doneFilter === 'week' ? 'active' : ''}" data-filter="week">Week</button>
          <button class="done-filter-btn ${doneFilter === 'month' ? 'active' : ''}" data-filter="month">Month</button>
          <button class="done-filter-btn ${doneFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
        </div>
      ` : ''}
    `;

    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'column-cards';

    for (const issue of colIssues) {
      cardsContainer.appendChild(createCard(issue));
    }

    // Drop zone events
    cardsContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      cardsContainer.classList.add('drag-over');
    });

    cardsContainer.addEventListener('dragleave', () => {
      cardsContainer.classList.remove('drag-over');
    });

    cardsContainer.addEventListener('drop', async (e) => {
      e.preventDefault();
      cardsContainer.classList.remove('drag-over');
      const issueId = e.dataTransfer.getData('text/plain');
      const newStatus = col.status;

      // Move the card in the DOM immediately (avoids re-render breaking drag state)
      const card = boardEl.querySelector(`.issue-card[data-issue-id="${issueId}"]`);
      if (card) {
        cardsContainer.appendChild(card);
      }

      // Update column counts
      boardEl.querySelectorAll('.board-column').forEach(colEl => {
        const count = colEl.querySelector('.column-cards').children.length;
        colEl.querySelector('.column-count').textContent = count;
      });

      try {
        await API.updateIssue(issueId, { status: newStatus });
        await loadData();
        // Don't re-render — DOM is already updated
      } catch (err) {
        console.error('Failed to update issue:', err);
        // On error, re-render to restore correct state
        await loadData();
        render();
      }
    });

    column.appendChild(cardsContainer);
    boardEl.appendChild(column);

    // Done filter buttons
    if (isDone) {
      column.querySelectorAll('.done-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          doneFilter = btn.dataset.filter;
          renderBoard(container);
        });
      });
    }
  }

  container.innerHTML = '';
  container.appendChild(boardEl);
}
