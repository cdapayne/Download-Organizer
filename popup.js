/**
 * popup.js
 * Toolbar popup — view and manage saved categories.
 */

(function () {
  const categoryList = document.getElementById('categoryList');
  const newCategoryInput = document.getElementById('newCategoryInput');
  const addBtn = document.getElementById('addBtn');
  const addHint = document.getElementById('addHint');
  const categoryCount = document.getElementById('categoryCount');
  const optionsBtn = document.getElementById('optionsBtn');

  function loadCategories() {
    chrome.runtime.sendMessage({ type: 'GET_CATEGORIES' }, (response) => {
      if (chrome.runtime.lastError) return;
      renderCategories(response.categories || []);
    });
  }

  function renderCategories(categories) {
    categoryCount.textContent = `${categories.length} saved`;
    categoryList.innerHTML = '';

    if (categories.length === 0) {
      categoryList.innerHTML = '<p class="empty-hint">No categories yet. Add one below!</p>';
      return;
    }

    categories.forEach((cat) => {
      const row = document.createElement('div');
      row.className = 'category-row';

      const icon = document.createElement('span');
      icon.className = 'folder-icon';
      icon.textContent = '📁';

      const name = document.createElement('span');
      name.className = 'category-name';
      name.textContent = cat;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-icon delete-btn';
      deleteBtn.title = `Remove "${cat}"`;
      deleteBtn.innerHTML = '&times;';
      deleteBtn.addEventListener('click', () => handleDelete(cat));

      row.appendChild(icon);
      row.appendChild(name);
      row.appendChild(deleteBtn);
      categoryList.appendChild(row);
    });
  }

  function handleAdd() {
    const name = newCategoryInput.value.trim();
    if (!name) {
      showHint('Please enter a category name.', 'error');
      return;
    }

    chrome.runtime.sendMessage({ type: 'ADD_CATEGORY', category: name }, () => {
      if (chrome.runtime.lastError) return;
      newCategoryInput.value = '';
      showHint(`"${name}" added!`, 'success');
      loadCategories();
    });
  }

  function handleDelete(name) {
    chrome.runtime.sendMessage({ type: 'REMOVE_CATEGORY', category: name }, () => {
      if (chrome.runtime.lastError) return;
      loadCategories();
    });
  }

  function showHint(msg, type) {
    addHint.textContent = msg;
    addHint.className = `hint-text hint-${type}`;
    setTimeout(() => { addHint.textContent = ''; addHint.className = 'hint-text'; }, 2500);
  }

  addBtn.addEventListener('click', handleAdd);
  newCategoryInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAdd();
  });

  optionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  loadCategories();
})();
