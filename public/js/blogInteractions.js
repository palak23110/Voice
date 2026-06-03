// Views modal, comment polling, and blog card interactions

document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('viewsModal');
  const modalBody = document.getElementById('viewsModalBody');

  function openModal() {
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  modal?.querySelectorAll('[data-close-modal]').forEach((el) => {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  async function loadViewers(blogId) {
    if (!modalBody) return;
    modalBody.innerHTML = '<p class="views-modal-loading">Loading viewers...</p>';
    openModal();

    try {
      const res = await fetch(`/api/blog/${blogId}/viewers`);
      const data = await res.json();

      if (!data.viewers || data.viewers.length === 0) {
        modalBody.innerHTML = '<p class="views-modal-empty">No registered viewers yet. Views are tracked for logged-in readers.</p>';
        return;
      }

      modalBody.innerHTML = data.viewers.map((viewer) => {
        const viewed = new Date(viewer.viewedAt);
        const dateStr = viewed.toLocaleDateString('en-US', { dateStyle: 'medium' });
        const timeStr = viewed.toLocaleTimeString('en-US', { timeStyle: 'short' });
        const avatar = viewer.profileImage
          ? `<img src="${viewer.profileImage}" alt="${viewer.username}" class="viewer-avatar">`
          : `<span class="viewer-avatar viewer-avatar-fallback">${(viewer.username || '?').charAt(0).toUpperCase()}</span>`;

        return `
          <article class="viewer-row">
            <a href="${viewer.profileUrl}" class="viewer-avatar-link">${avatar}</a>
            <div class="viewer-info">
              <a href="${viewer.profileUrl}" class="viewer-name">${viewer.username}</a>
              <span class="viewer-id">ID: ${viewer.userId || '—'}</span>
              <span class="viewer-time">${dateStr} · ${timeStr}</span>
            </div>
          </article>
        `;
      }).join('');
    } catch (err) {
      console.error(err);
      modalBody.innerHTML = '<p class="views-modal-empty">Unable to load viewers. Please try again.</p>';
    }
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.blog-views-trigger');
    if (trigger) {
      e.preventDefault();
      const blogId = trigger.getAttribute('data-blog-id');
      if (blogId) loadViewers(blogId);
    }
  });

  // Real-time comment refresh on blog detail
  const commentsSection = document.getElementById('comments');
  const commentsList = document.getElementById('commentsList');
  const countDisplay = document.getElementById('commentCountDisplay');
  const blogId = commentsSection?.getAttribute('data-blog-id');

  function renderComments(comments) {
    if (!commentsList) return;

    if (!comments.length) {
      commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to share your thoughts!</p>';
      return;
    }

    commentsList.innerHTML = comments.map((comment) => {
      const initial = (comment.author || '?').charAt(0).toUpperCase();
      const avatar = comment.authorImage
        ? `<img src="${comment.authorImage}" alt="${comment.author}" class="comment-avatar">`
        : `<span class="comment-avatar comment-avatar-fallback">${initial}</span>`;
      const when = new Date(comment.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

      return `
        <article class="comment-item">
          <div class="comment-header">
            <a href="${comment.profileUrl}" class="comment-avatar-link">${avatar}</a>
            <div class="comment-meta">
              <a href="${comment.profileUrl}" class="comment-author-name">${comment.author}</a>
              <time class="comment-timestamp" datetime="${comment.createdAt}">${when}</time>
            </div>
          </div>
          <p class="comment-content">${escapeHtml(comment.content)}</p>
        </article>
      `;
    }).join('');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async function refreshComments() {
    if (!blogId) return;
    try {
      const res = await fetch(`/api/blog/${blogId}/comments`);
      const data = await res.json();
      if (countDisplay) countDisplay.textContent = data.count;
      renderComments(data.comments || []);
    } catch (err) {
      console.error('Comment refresh failed', err);
    }
  }

  if (blogId && commentsList) {
    setInterval(refreshComments, 15000);
  }
});
