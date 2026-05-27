/**
 * dialog.js
 * Handles category selection / creation when a download is intercepted.
 */

(function () {
  const params = new URLSearchParams(window.location.search);
  const downloadId = Number(params.get('downloadId'));
  const rawFilename = params.get('filename') || 'file';
  // Show only the base filename (strip any path the browser may include)
  const basename = rawFilename.replace(/^.*[\\/]/, '');

  let selectedCategory = null;

  // ── DOM refs ────────────────────────────────────────────────────────────────
  const filenameDisplay = document.getElementById('filenameDisplay');
  const categoryList = document.getElementById('categoryList');
  const newCategoryInput = document.getElementById('newCategoryInput');
  const addCategoryBtn = document.getElementById('addCategoryBtn');
  const saveBtn = document.getElementById('saveBtn');
  const skipBtn = document.getElementById('skipBtn');

  filenameDisplay.textContent = basename;

  // ── Load categories from background ─────────────────────────────────────────
  function loadCategories() {
    chrome.runtime.sendMessage({ type: 'GET_CATEGORIES' }, (response) => {
      if (chrome.runtime.lastError) return;
      renderCategories(response.categories || []);
    });
  }

  function renderCategories(categories) {
    categoryList.innerHTML = '';
    if (categories.length === 0) {
      categoryList.innerHTML = '<p class="empty-hint">No categories yet — create one below.</p>';
      return;
    }
    categories.forEach((cat) => {
      const btn = document.createElement('button');
      btn.className = 'category-chip';
      btn.textContent = cat;
      btn.dataset.category = cat;
      btn.addEventListener('click', () => selectCategory(cat, btn));
      categoryList.appendChild(btn);
    });
  }

  function selectCategory(name, btnEl) {
    // Deselect previous
    categoryList.querySelectorAll('.category-chip').forEach((b) => b.classList.remove('selected'));
    btnEl.classList.add('selected');
    selectedCategory = name;
    newCategoryInput.value = '';
    saveBtn.disabled = false;
  }

  // ── Add new category inline ──────────────────────────────────────────────────
  function handleAddCategory() {
    const name = newCategoryInput.value.trim();
    if (!name) return;

    // Notify background to persist it
    chrome.runtime.sendMessage({ type: 'ADD_CATEGORY', category: name }, () => {
      if (chrome.runtime.lastError) return;
      selectedCategory = name;
      newCategoryInput.value = '';
      saveBtn.disabled = false;
      loadCategories();
      // Visually select the new chip after re-render (slight delay for DOM)
      setTimeout(() => {
        const chip = categoryList.querySelector(`[data-category="${CSS.escape(name)}"]`);
        if (chip) {
          categoryList.querySelectorAll('.category-chip').forEach((b) => b.classList.remove('selected'));
          chip.classList.add('selected');
        }
      }, 50);
    });
  }

  addCategoryBtn.addEventListener('click', handleAddCategory);

  newCategoryInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddCategory();
  });

  // Typing in new input deselects chip selection and enables save when non-empty
  newCategoryInput.addEventListener('input', () => {
    const hasText = newCategoryInput.value.trim().length > 0;
    if (hasText) {
      categoryList.querySelectorAll('.category-chip').forEach((b) => b.classList.remove('selected'));
      selectedCategory = newCategoryInput.value.trim();
      saveBtn.disabled = false;
    } else {
      selectedCategory = null;
      saveBtn.disabled = true;
    }
  });

  // ── Save / Skip ──────────────────────────────────────────────────────────────
  saveBtn.addEventListener('click', () => {
    const category = newCategoryInput.value.trim() || selectedCategory;
    if (!category) return;

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';

    chrome.runtime.sendMessage(
      { type: 'CATEGORY_SELECTED', downloadId, category, filename: basename },
      () => {
        if (chrome.runtime.lastError) { /* window may already be closing */ }
        window.close();
      }
    );
  });

  skipBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'SKIP_CATEGORIZATION', downloadId }, () => {
      window.close();
    });
  });

  // ── Init ─────────────────────────────────────────────────────────────────────
  loadCategories();
})();
