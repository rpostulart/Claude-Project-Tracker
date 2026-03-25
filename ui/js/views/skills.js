// Skills view — manage .project/skills/ files
import API from '../api.js';
import { navigate } from '../app.js';
import { renderMarkdown } from '../components/markdown.js';
import { openModal, closeModal } from '../components/modal.js';

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export async function renderSkills(container) {
  const { skills } = await API.getSkills();
  const sorted = [...skills].sort((a, b) => a.name.localeCompare(b.name));

  container.innerHTML = `
    <div class="skills-container">
      <div class="skills-header">
        <div>
          <h2 class="skills-title">Skills</h2>
          <p class="skills-subtitle">Claude Code skills for project management. These are loaded from <code>.project/skills/</code> and synced to <code>.claude/skills/</code>.</p>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-new-skill">+ New Skill</button>
      </div>
      <div class="skills-grid">
        ${sorted.length === 0 ? '<p class="skills-empty">No skills defined yet.</p>' : ''}
        ${sorted.map(s => {
          const fm = s.frontmatter || {};
          const argHint = fm['argument-hint'] || '';
          const tools = fm['allowed-tools'] || '';
          return `
          <div class="skill-card" data-slug="${s.slug}">
            <div class="skill-card-header">
              <span class="skill-card-name">/${s.name}${argHint ? ` <span class="skill-arg-hint">${escapeHtml(argHint)}</span>` : ''}</span>
              <div class="skill-card-actions">
                <button class="btn btn-ghost btn-sm skill-edit" data-slug="${s.slug}">Edit</button>
                <button class="btn btn-ghost btn-sm skill-delete wiki-btn-danger" data-slug="${s.slug}">Delete</button>
              </div>
            </div>
            <p class="skill-card-desc">${escapeHtml(s.description)}</p>
            ${tools ? `<div class="skill-card-tools">${tools.split(',').map(t => `<span class="skill-tool-badge">${escapeHtml(t.trim())}</span>`).join('')}</div>` : ''}
            <div class="skill-card-preview">${renderMarkdown(s.content.slice(0, 300) + (s.content.length > 300 ? '...' : ''))}</div>
          </div>
        `}).join('')}
      </div>
    </div>
  `;

  // Edit skill
  container.querySelectorAll('.skill-edit').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const slug = btn.dataset.slug;
      const { content } = await API.getSkill(slug);
      openModal('Edit Skill', `
        <div class="form-group">
          <label>Skill File (${slug}.md)</label>
          <textarea id="skill-content" style="min-height:400px;font-family:var(--font-mono);font-size:13px;">${escapeHtml(content)}</textarea>
        </div>
      `, {
        saveLabel: 'Save',
        onSave: async (overlay) => {
          const newContent = overlay.querySelector('#skill-content').value;
          await API.saveSkill(slug, newContent);
          await API.syncSkills();
          closeModal();
          renderSkills(container);
        }
      });
    });
  });

  // Delete skill
  container.querySelectorAll('.skill-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const slug = btn.dataset.slug;
      if (confirm(`Delete skill "${slug}"?`)) {
        await API.deleteSkill(slug);
        await API.syncSkills();
        renderSkills(container);
      }
    });
  });

  // New skill
  container.querySelector('#btn-new-skill').addEventListener('click', () => {
    const template = `Describe what this skill does.

## Steps

1. First step
2. Second step
3. Third step

## Example

\`/my-skill some-argument\` does something useful.`;

    openModal('New Skill', `
      <div class="form-group">
        <label>Skill Name</label>
        <input type="text" id="skill-new-name" placeholder="e.g. deploy-check">
      </div>
      <div class="form-group">
        <label>Description (when should Claude use this skill?)</label>
        <input type="text" id="skill-new-desc" placeholder="e.g. Deploy the app. Use when asked to deploy, release, or ship.">
      </div>
      <div class="form-group">
        <label>Argument Hint (optional)</label>
        <input type="text" id="skill-new-args" placeholder="e.g. <environment>">
      </div>
      <div class="form-group">
        <label>Allowed Tools (comma-separated)</label>
        <input type="text" id="skill-new-tools" placeholder="e.g. Read, Write, Edit, Glob, Bash(git *)">
      </div>
      <div class="form-group">
        <label>Instructions (Markdown)</label>
        <textarea id="skill-new-content" style="min-height:300px;font-family:var(--font-mono);font-size:13px;">${escapeHtml(template)}</textarea>
      </div>
    `, {
      saveLabel: 'Create',
      onSave: async (overlay) => {
        const name = overlay.querySelector('#skill-new-name').value.trim();
        const desc = overlay.querySelector('#skill-new-desc').value.trim();
        const args = overlay.querySelector('#skill-new-args').value.trim();
        const tools = overlay.querySelector('#skill-new-tools').value.trim();
        const body = overlay.querySelector('#skill-new-content').value;
        if (!name) return;

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        let frontmatter = `---\nname: ${name}\ndescription: ${desc}`;
        if (args) frontmatter += `\nargument-hint: ${args}`;
        if (tools) frontmatter += `\nallowed-tools: ${tools}`;
        frontmatter += `\n---`;
        const content = `${frontmatter}\n\n${body}`;
        await API.saveSkill(slug, content);
        await API.syncSkills();
        closeModal();
        renderSkills(container);
      }
    });
  });
}
