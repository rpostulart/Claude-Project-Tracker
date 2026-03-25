// Modal component

export function openModal(title, contentHtml, { onSave, saveLabel = 'Save', width = '600px' } = {}) {
  closeModal(); // Close any existing

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width: ${width}">
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="modal-close" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body">${contentHtml}</div>
      ${onSave ? `
        <div class="modal-footer">
          <button class="btn btn-secondary modal-cancel">Cancel</button>
          <button class="btn btn-primary modal-save">${saveLabel}</button>
        </div>
      ` : ''}
    </div>
  `;

  document.body.appendChild(overlay);

  // Focus first input
  requestAnimationFrame(() => {
    const firstInput = overlay.querySelector('input, textarea, select');
    if (firstInput) firstInput.focus();
  });

  // Event listeners
  overlay.querySelector('.modal-close').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  const cancelBtn = overlay.querySelector('.modal-cancel');
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  const saveBtn = overlay.querySelector('.modal-save');
  if (saveBtn && onSave) {
    saveBtn.addEventListener('click', () => {
      onSave(overlay);
    });
  }

  // Escape key
  const onKey = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', onKey);
    }
  };
  document.addEventListener('keydown', onKey);

  return overlay;
}

export function closeModal() {
  const existing = document.querySelector('.modal-overlay');
  if (existing) existing.remove();
}
