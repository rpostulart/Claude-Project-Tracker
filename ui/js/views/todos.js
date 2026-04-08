// Todos view — aggregates all todo-type comments across issues
import API from '../api.js';
import { navigate } from '../app.js';
import { renderMarkdown } from '../components/markdown.js';

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

let hideClosed = false;

export async function renderTodos(container) {
  const todos = await API.getTodos();
  const openCount = todos.filter(t => !t.done).length;
  const doneCount = todos.filter(t => t.done).length;
  const visible = hideClosed ? todos.filter(t => !t.done) : todos;

  container.innerHTML = `
    <div class="todos-container">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
        <h2 style="margin:0">Todos</h2>
        <div style="display:flex;align-items:center;gap:16px;">
          <label class="todo-filter-label">
            <input type="checkbox" id="hide-closed" ${hideClosed ? 'checked' : ''}>
            Hide closed
          </label>
          <span class="text-muted" style="font-size:13px">${openCount} open, ${doneCount} done</span>
        </div>
      </div>
      <div class="todos-list">
        ${visible.length === 0 ? `<p class="text-muted">${hideClosed && doneCount > 0 ? 'All todos are done!' : 'No todos yet. Add todos from issue comments.'}</p>` : ''}
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

  // Hide closed filter
  container.querySelector('#hide-closed').addEventListener('change', (e) => {
    hideClosed = e.target.checked;
    renderTodos(container);
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
