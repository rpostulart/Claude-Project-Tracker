// Todos view — aggregates all todo-type comments across issues
import API from '../api.js';
import { navigate } from '../app.js';
import { renderMarkdown } from '../components/markdown.js';

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

let todoFilter = 'open'; // 'open', 'all', 'closed'

export async function renderTodos(container) {
  const todos = await API.getTodos();
  const openCount = todos.filter(t => !t.done).length;
  const doneCount = todos.filter(t => t.done).length;
  const visible = todoFilter === 'open' ? todos.filter(t => !t.done)
    : todoFilter === 'closed' ? todos.filter(t => t.done)
    : todos;

  container.innerHTML = `
    <div class="todos-container">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
        <h2 style="margin:0">Todos</h2>
        <div style="display:flex;align-items:center;gap:16px;">
          <div class="todo-filter">
            <button class="done-filter-btn${todoFilter === 'open' ? ' active' : ''}" data-filter="open">Open <span class="text-muted">${openCount}</span></button>
            <button class="done-filter-btn${todoFilter === 'all' ? ' active' : ''}" data-filter="all">All <span class="text-muted">${openCount + doneCount}</span></button>
            <button class="done-filter-btn${todoFilter === 'closed' ? ' active' : ''}" data-filter="closed">Closed <span class="text-muted">${doneCount}</span></button>
          </div>
        </div>
      </div>
      <div class="todos-list">
        ${visible.length === 0 ? `<p class="text-muted">${todoFilter === 'open' && doneCount > 0 ? 'All todos are done!' : todoFilter === 'closed' && openCount > 0 ? 'No closed todos yet.' : 'No todos yet. Add todos from issue comments.'}</p>` : ''}
        ${visible.map(todo => `
          <div class="todo-row${todo.done ? ' todo-row-done' : ''}">
            <label class="todo-checkbox-label">
              <input type="checkbox" class="todo-toggle"
                data-issue-id="${todo.issueId}"
                data-comment-id="${todo.id}"
                ${todo.done ? 'checked' : ''}>
            </label>
            <div class="todo-content">
              <div class="todo-text${todo.done ? ' todo-done' : ''}">${renderMarkdown(todo.content || '')}</div>
              <a class="todo-issue-link" data-issue-id="${todo.issueId}">
                ${escapeHtml(todo.issueId)}: ${escapeHtml(todo.issueTitle)}
              </a>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Filter buttons
  container.querySelectorAll('.todo-filter .done-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      todoFilter = btn.dataset.filter;
      renderTodos(container);
    });
  });

  // Checkbox toggle handlers
  container.querySelectorAll('.todo-toggle').forEach(cb => {
    cb.addEventListener('change', async () => {
      await API.updateComment(cb.dataset.issueId, cb.dataset.commentId, { done: cb.checked });
      await renderTodos(container);
    });
  });

  // Issue link handlers
  container.querySelectorAll('.todo-issue-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigate('detail', { issueId: link.dataset.issueId });
    });
  });
}
