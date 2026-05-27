/**
 * options.js
 * Options page — full category management + settings.
 */

(function () {
  const categoriesTable = document.getElementById('categoriesTable');
  const newCategoryInput = document.getElementById('newCategoryInput');
  const addCategoryBtn = document.getElementById('addCategoryBtn');
  const addHint = document.getElementById('addHint');
  const alwaysAskToggle = document.getElementById('alwaysAsk');
  const defaultCategorySelect = document.getElementById('defaultCategory');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const saveStatus = document.getElementById('saveStatus');

  let currentCategories = [];

  // ── Load ─────────────────────────────────────────────────────────────────────
  function load() {
    chrome.storage.sync.get(
      { categories: [], settings: { alwaysAsk: true, defaultCategory: '' } },
      (data) => {
        currentCategories = data.categories;
        renderTable(currentCategories);
        populateDefaultSelect(currentCategories, data.settings.defaultCategory);
        alwaysAskToggle.checked = data.settings.alwaysAsk !== false;
      }
    );
  }

  // ── Render category table ────────────────────────────────────────────────────
  function renderTable(categories) {
    categoriesTable.innerHTML = '';

    if (categories.length === 0) {
      categoriesTable.innerHTML = '<p class="empty-hint">No categories yet. Add one below.</p>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'cat-table';

    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Category name</th>
        <th>Folder path (relative to Downloads)</th>
        <th></th>
      </tr>`;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    categories.forEach((cat) => {
      const tr = document.createElement('tr');

      const tdName = document.createElement('td');
      tdName.textContent = cat;

      const tdPath = document.createElement('td');
      tdPath.className = 'path-cell';
      tdPath.innerHTML = `<code>Downloads/${cat}/</code>`;

      const tdAction = document.createElement('td');
      tdAction.className = 'action-cell';
      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-danger btn-sm';
      delBtn.textContent = 'Remove';
      delBtn.addEventListener('click', () => handleDelete(cat));
      tdAction.appendChild(delBtn);

      tr.appendChild(tdName);
      tr.appendChild(tdPath);
      tr.appendChild(tdAction);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    categoriesTable.appendChild(table);
  }

  // ── Default category select ──────────────────────────────────────────────────
  function populateDefaultSelect(categories, selected) {
    defaultCategorySelect.innerHTML = '<option value="">— None —</option>';
    categories.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      if (cat === selected) opt.selected = true;
      defaultCategorySelect.appendChild(opt);
    });
  }

  // ── Add category ─────────────────────────────────────────────────────────────
  function handleAdd() {
    const name = newCategoryInput.value.trim();
    if (!name) {
      showHint('Please enter a category name.', 'error');
      return;
    }
    if (currentCategories.includes(name)) {
      showHint(`"${name}" already exists.`, 'error');
      return;
    }

    chrome.runtime.sendMessage({ type: 'ADD_CATEGORY', category: name }, () => {
      if (chrome.runtime.lastError) return;
      newCategoryInput.value = '';
      showHint(`"${name}" added.`, 'success');
      load();
    });
  }

  // ── Delete category ──────────────────────────────────────────────────────────
  function handleDelete(name) {
    if (!confirm(`Remove the category "${name}"?\n\nExisting files in that folder are not affected.`)) return;

    chrome.runtime.sendMessage({ type: 'REMOVE_CATEGORY', category: name }, () => {
      if (chrome.runtime.lastError) return;
      load();
    });
  }

  // ── Save settings ─────────────────────────────────────────────────────────────
  saveSettingsBtn.addEventListener('click', () => {
    const settings = {
      alwaysAsk: alwaysAskToggle.checked,
      defaultCategory: defaultCategorySelect.value
    };

    chrome.storage.sync.set({ settings }, () => {
      if (chrome.runtime.lastError) {
        showSaveStatus('Error saving settings.', 'error');
        return;
      }
      showSaveStatus('Settings saved!', 'success');
    });
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function showHint(msg, type) {
    addHint.textContent = msg;
    addHint.className = `hint-text hint-${type}`;
    setTimeout(() => { addHint.textContent = ''; addHint.className = 'hint-text'; }, 3000);
  }

  function showSaveStatus(msg, type) {
    saveStatus.textContent = msg;
    saveStatus.className = `save-status save-status-${type}`;
    setTimeout(() => { saveStatus.textContent = ''; saveStatus.className = 'save-status'; }, 3000);
  }

  addCategoryBtn.addEventListener('click', handleAdd);
  newCategoryInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAdd();
  });

  load();
})();
