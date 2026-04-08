// Todos view — aggregates all todo-type comments across issues
import API from '../api.js';
import { navigate } from '../app.js';
import { renderMarkdown } from '../components/markdown.js';

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export async function renderTodos(container) {
  const todos = await API.getTodos();

  container.innerHTML = `
    <div class="todos-container">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
        <h2 style="margin:0">Todos</h2>
        <span class="text-muted" style="font-size:13px">${todos.filter(t => !t.done).length} open, ${todos.filter(t => t.done).length} done</span>
      </div>
      <div class="todos-list">
        ${todos.length === 0 ? '<p class="text-muted">No todos yet. Add todos from issue comments.</p>' : ''}
        ${todos.map(todo => `
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
