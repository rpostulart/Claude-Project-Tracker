// List view with sorting, filtering, date range, and pagination
import API from '../api.js';
import { state, navigate, loadData } from '../app.js';

let sortField = 'id';
let sortDir = 'asc';
let filterText = '';
let filterStatus = '';
let filterType = '';
let filterDate = ''; // 'day', 'week', 'month', 'year', 'custom'
let filterDateFrom = '';
let filterDateTo = '';
let currentPage = 1;
const PAGE_SIZE = 25;

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getInitials(email) {
  if (!email) return '';
  const name = state.config?.team?.find(m => m.email === email)?.name || email;
  return name.split(/[\s@]/).filter(Boolean).map(p => p[0].toUpperCase()).slice(0, 2).join('');
}

function sortIssues(issues) {
  return [...issues].sort((a, b) => {
    let aVal = a[sortField] || '';
    let bVal = b[sortField] || '';
    if (sortField === 'priority') {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      aVal = order[aVal] ?? 4;
      bVal = order[bVal] ?? 4;
    }
    if (sortField === 'id') {
      const aNum = parseInt(aVal.split('-')[1]);
      const bNum = parseInt(bVal.split('-')[1]);
      return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
    }
    const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
    return sortDir === 'asc' ? cmp : -cmp;
  });
}

function getDateCutoff() {
  if (!filterDate) return null;
  const now = new Date();
  switch (filterDate) {
    case 'day': return new Date(now - 24 * 60 * 60 * 1000);
    case 'week': return new Date(now - 7 * 24 * 60 * 60 * 1000);
    case 'month': return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case 'year': return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    case 'custom': return null; // handled separately
    default: return null;
  }
}

function filterIssues(issues) {
  return issues.filter(issue => {
    if (filterText) {
      const text = filterText.toLowerCase();
      const match = issue.title.toLowerCase().includes(text) ||
        issue.id.toLowerCase().includes(text) ||
        (issue.labels || []).some(l => l.toLowerCase().includes(text));
      if (!match) return false;
    }
    if (filterStatus && issue.status !== filterStatus) return false;
    if (filterType && issue.type !== filterType) return false;

    // Date filter
    if (filterDate) {
      const issueDate = new Date(issue.updated || issue.created);
      if (filterDate === 'custom') {
        if (filterDateFrom && issueDate < new Date(filterDateFrom)) return false;
        if (filterDateTo && issueDate > new Date(filterDateTo + 'T23:59:59')) return false;
      } else {
        const cutoff = getDateCutoff();
        if (cutoff && issueDate < cutoff) return false;
      }
    }

    return true;
  });
}

function renderTable(container) {
  const filtered = sortIssues(filterIssues(state.issues));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * PAGE_SIZE;
  const paged = filtered.slice(start, start + PAGE_SIZE);

  const tableEl = container.querySelector('.issue-table tbody');
  if (!tableEl) return;

  // Update header sort indicators
  container.querySelectorAll('.issue-table th').forEach(th => {
    const arrow = th.querySelector('.sort-arrow');
    if (th.dataset.sort === sortField) {
      th.classList.add('sorted');
      if (arrow) arrow.textContent = sortDir === 'asc' ? '↑' : '↓';
    } else {
      th.classList.remove('sorted');
      if (arrow) arrow.textContent = '↕';
    }
  });

  tableEl.innerHTML = paged.map(issue => `
    <tr data-id="${issue.id}">
      <td><span class="issue-id">${issue.id}</span></td>
      <td><span class="issue-type ${issue.type}" style="display:inline-flex;width:20px;height:20px;font-size:11px;">${
        { feature: '★', bug: '●', task: '◆', epic: '⚡' }[issue.type] || '◆'
      }</span></td>
      <td>${escapeHtml(issue.title)}${issue.parent ? ` <span class="issue-id">↳ ${issue.parent}</span>` : ''}</td>
      <td><span class="status-badge ${issue.status}">${issue.status}</span></td>
      <td><span class="priority-badge"><span class="priority-dot ${issue.priority}"></span>${issue.priority}</span></td>
      <td>${issue.assignee ? `<span class="avatar" style="display:inline-flex" title="${issue.assignee}">${getInitials(issue.assignee)}</span>` : '—'}</td>
      <td style="font-size:13px;color:var(--color-text-muted)">${new Date(issue.updated).toLocaleDateString()}</td>
      <td><button class="btn-delete-issue" data-id="${issue.id}" title="Delete ${issue.id}">✕</button></td>
    </tr>
  `).join('');

  // Pagination
  const paginationEl = container.querySelector('.list-pagination');
  if (paginationEl) {
    paginationEl.innerHTML = `
      <span class="list-pagination-info">${filtered.length} issue${filtered.length !== 1 ? 's' : ''}${filtered.length > PAGE_SIZE ? ` — page ${currentPage} of ${totalPages}` : ''}</span>
      ${totalPages > 1 ? `
        <div class="list-pagination-buttons">
          <button class="btn btn-ghost btn-sm" id="btn-page-prev" ${currentPage <= 1 ? 'disabled' : ''}>← Prev</button>
          <button class="btn btn-ghost btn-sm" id="btn-page-next" ${currentPage >= totalPages ? 'disabled' : ''}>Next →</button>
        </div>
      ` : ''}
    `;

    const prevBtn = paginationEl.querySelector('#btn-page-prev');
    const nextBtn = paginationEl.querySelector('#btn-page-next');
    if (prevBtn) prevBtn.addEventListener('click', () => { currentPage--; renderTable(container); });
    if (nextBtn) nextBtn.addEventListener('click', () => { currentPage++; renderTable(container); });
  }

  // Row click
  tableEl.querySelectorAll('tr').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.btn-delete-issue')) return;
      navigate('detail', { issueId: row.dataset.id });
    });
  });

  // Delete buttons
  tableEl.querySelectorAll('.btn-delete-issue').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const subtasks = state.issues.filter(i => i.parent === id);
      const msg = subtasks.length > 0
        ? `Delete ${id} and its ${subtasks.length} subtask(s) (${subtasks.map(s => s.id).join(', ')})?`
        : `Delete issue ${id}?`;
      if (confirm(msg)) {
        for (const st of subtasks) {
          await API.deleteIssue(st.id);
        }
        await API.deleteIssue(id);
        await loadData();
        renderTable(container);
      }
    });
  });
}

export async function renderList(container) {
  const statuses = state.config?.statuses || [];
  const types = state.config?.types || [];

  container.innerHTML = `
    <div class="list-container">
      <div class="list-toolbar">
        <input type="text" placeholder="Search issues..." class="list-search" value="${escapeHtml(filterText)}">
        <select class="list-filter-status">
          <option value="">All Statuses</option>
          ${statuses.map(s => `<option value="${s}" ${filterStatus === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
        <select class="list-filter-type">
          <option value="">All Types</option>
          ${types.map(t => `<option value="${t}" ${filterType === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
        <select class="list-filter-date">
          <option value="">All Time</option>
          <option value="day" ${filterDate === 'day' ? 'selected' : ''}>Last 24h</option>
          <option value="week" ${filterDate === 'week' ? 'selected' : ''}>Last Week</option>
          <option value="month" ${filterDate === 'month' ? 'selected' : ''}>Last Month</option>
          <option value="year" ${filterDate === 'year' ? 'selected' : ''}>Last Year</option>
          <option value="custom" ${filterDate === 'custom' ? 'selected' : ''}>Custom Range</option>
        </select>
      </div>
      <div class="list-date-range" id="list-date-range" style="display:${filterDate === 'custom' ? 'flex' : 'none'}">
        <label>From</label>
        <input type="date" class="list-date-from" value="${filterDateFrom}">
        <label>To</label>
        <input type="date" class="list-date-to" value="${filterDateTo}">
      </div>
      <table class="issue-table">
        <thead>
          <tr>
            <th data-sort="id">ID <span class="sort-arrow">↕</span></th>
            <th data-sort="type">Type <span class="sort-arrow">↕</span></th>
            <th data-sort="title">Title <span class="sort-arrow">↕</span></th>
            <th data-sort="status">Status <span class="sort-arrow">↕</span></th>
            <th data-sort="priority">Priority <span class="sort-arrow">↕</span></th>
            <th data-sort="assignee">Assignee <span class="sort-arrow">↕</span></th>
            <th data-sort="updated">Updated <span class="sort-arrow">↕</span></th>
            <th style="width:40px"></th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
      <div class="list-pagination"></div>
    </div>
  `;

  // Sort click handlers
  container.querySelectorAll('.issue-table th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (sortField === field) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        sortField = field;
        sortDir = 'asc';
      }
      renderTable(container);
    });
  });

  // Filter handlers
  container.querySelector('.list-search').addEventListener('input', (e) => {
    filterText = e.target.value;
    currentPage = 1;
    renderTable(container);
  });

  container.querySelector('.list-filter-status').addEventListener('change', (e) => {
    filterStatus = e.target.value;
    currentPage = 1;
    renderTable(container);
  });

  container.querySelector('.list-filter-type').addEventListener('change', (e) => {
    filterType = e.target.value;
    currentPage = 1;
    renderTable(container);
  });

  // Date filter
  const dateSelect = container.querySelector('.list-filter-date');
  const dateRange = container.querySelector('#list-date-range');

  dateSelect.addEventListener('change', (e) => {
    filterDate = e.target.value;
    dateRange.style.display = filterDate === 'custom' ? 'flex' : 'none';
    if (filterDate !== 'custom') {
      filterDateFrom = '';
      filterDateTo = '';
    }
    currentPage = 1;
    renderTable(container);
  });

  container.querySelector('.list-date-from').addEventListener('change', (e) => {
    filterDateFrom = e.target.value;
    currentPage = 1;
    renderTable(container);
  });

  container.querySelector('.list-date-to').addEventListener('change', (e) => {
    filterDateTo = e.target.value;
    currentPage = 1;
    renderTable(container);
  });

  renderTable(container);
}
