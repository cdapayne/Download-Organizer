/**
 * background.js — Service Worker
 *
 * Intercepts every download via chrome.downloads.onDeterminingFilename.
 * Opens a small dialog so the user can pick or create a category.
 * Once confirmed the file is routed to: <Downloads>/<category>/<filename>
 */

// Map of downloadId → suggest callback (kept alive while the SW is active)
const pendingSuggestions = new Map();

// Open the category-selection dialog for the given download
function openCategoryDialog(downloadItem) {
  const params = new URLSearchParams({
    downloadId: String(downloadItem.id),
    filename: downloadItem.filename || downloadItem.url.split('/').pop() || 'file',
    mime: downloadItem.mime || '',
    finalUrl: downloadItem.finalUrl || downloadItem.url || ''
  });

  chrome.windows.create({
    url: `dialog.html?${params.toString()}`,
    type: 'popup',
    width: 420,
    height: 370,
    focused: true
  });
}

// Intercept downloads before the filename is finalised
chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
  pendingSuggestions.set(downloadItem.id, {
    suggest,
    filename: downloadItem.filename || downloadItem.url.split('/').pop() || 'file'
  });

  openCategoryDialog(downloadItem);

  // Return true → we will call suggest() asynchronously
  return true;
});

// Handle messages from dialog.js
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'CATEGORY_SELECTED') {
    const { downloadId, category, filename } = message;
    const pending = pendingSuggestions.get(downloadId);

    if (pending) {
      // Save the category so it appears in the popup / options
      saveRecentCategory(category);

      // Build path: category/filename  (relative to the default Downloads dir)
      const baseName = (filename || pending.filename).replace(/^.*[\\/]/, '');
      const newPath = `${category}/${baseName}`;
      pending.suggest({ filename: newPath, conflictAction: 'uniquify' });
      pendingSuggestions.delete(downloadId);
    }
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'SKIP_CATEGORIZATION') {
    const { downloadId } = message;
    const pending = pendingSuggestions.get(downloadId);

    if (pending) {
      pending.suggest(); // keep default filename / location
      pendingSuggestions.delete(downloadId);
    }
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'GET_CATEGORIES') {
    getCategories().then((categories) => sendResponse({ categories }));
    return true; // async
  }

  if (message.type === 'ADD_CATEGORY') {
    addCategory(message.category).then(() => sendResponse({ success: true }));
    return true;
  }

  if (message.type === 'REMOVE_CATEGORY') {
    removeCategory(message.category).then(() => sendResponse({ success: true }));
    return true;
  }
});

// ── Storage helpers ──────────────────────────────────────────────────────────

const DEFAULT_CATEGORIES = ['Documents', 'Images', 'Music', 'Videos', 'Work', 'Personal'];

async function getCategories() {
  const result = await chrome.storage.sync.get({ categories: DEFAULT_CATEGORIES });
  return result.categories;
}

async function addCategory(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const categories = await getCategories();
  if (!categories.includes(trimmed)) {
    categories.push(trimmed);
    await chrome.storage.sync.set({ categories });
  }
}

async function removeCategory(name) {
  const categories = await getCategories();
  const updated = categories.filter((c) => c !== name);
  await chrome.storage.sync.set({ categories: updated });
}

async function saveRecentCategory(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  // Also ensure the category exists in the saved list
  await addCategory(trimmed);
}
