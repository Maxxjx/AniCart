import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

/**
 * AniCart - A simple anime tracking application
 * 
 * This application allows users to create and manage a list of anime titles.
 * It supports both local storage and Firebase synchronization.
 * 
 * Key features:
 * - Add/remove anime titles
 * - Local storage persistence
 * - Firebase synchronization (optional)
 * - Light/dark theme toggle
 * - Responsive design
 * - Offline support via Service Worker
 */

// Performance optimization: Debounce function for handling repeated events
/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last invocation.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} delay - The delay in milliseconds
 * @return {Function} - The debounced function
 */
const debounce = (func, delay) => {
  let debounceTimer;
  return function(...args) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(this, args), delay);
  };
};

// DOM Elements
const inputFieldEl = document.getElementById("inputel");
const inputValidationEl = document.getElementById("input-validation");
const addButtonEl = document.getElementById("add");
const listItem = document.getElementById("list");
const clearAllBtn = document.getElementById("clear-all");
const syncButton = document.getElementById("syncButton");
const modalOverlay = document.getElementById("modalOverlay");
const closeModal = document.getElementById("closeModal");
const helpIcon = document.getElementById("helpIcon");
const firebaseUrlInput = document.getElementById("firebaseUrl");
const firebaseValidationEl = document.getElementById("firebase-validation");
const firebaseForm = document.getElementById("firebase-form");
const saveConfig = document.getElementById("saveConfig");
const cancelConfig = document.getElementById("cancelConfig");
const themeToggle = document.getElementById("themeToggle");
const loader = document.getElementById("loader");
const toast = document.getElementById("toast");

// App State
let animeList = JSON.parse(localStorage.getItem('animeList')) || [];
let app, database, animeInDB;

/**
 * Form validation for anime input
 * @param {string} value - The input value to validate
 * @returns {boolean} - Whether the input is valid
 */
function validateAnimeInput(value) {
  // Input is required and must be between 2 and 50 characters
  if (!value || value.trim() === '') {
    showInputValidation("Please enter an anime title");
    return false;
  }
  
  if (value.trim().length < 2) {
    showInputValidation("Title must be at least 2 characters");
    return false;
  }
  
  if (value.trim().length > 50) {
    showInputValidation("Title must be less than 50 characters");
    return false;
  }
  
  // Check for duplicates
  if (animeList.some(anime => anime.value.toLowerCase() === value.trim().toLowerCase())) {
    showInputValidation("This anime is already in your list");
    return false;
  }
  
  // Clear validation message if valid
  hideInputValidation();
  return true;
}

/**
 * Shows validation message for the input field
 * @param {string} message - The validation message to display
 */
function showInputValidation(message) {
  inputValidationEl.textContent = message;
  inputValidationEl.classList.add('visible');
  inputFieldEl.setAttribute('aria-invalid', 'true');
}

/**
 * Hides the input validation message
 */
function hideInputValidation() {
  inputValidationEl.textContent = '';
  inputValidationEl.classList.remove('visible');
  inputFieldEl.setAttribute('aria-invalid', 'false');
}

/**
 * Shows validation message for the Firebase URL field
 * @param {string} message - The validation message to display
 */
function showFirebaseValidation(message) {
  firebaseValidationEl.textContent = message;
  firebaseValidationEl.classList.add('visible');
  firebaseUrlInput.setAttribute('aria-invalid', 'true');
}

/**
 * Hides the Firebase URL validation message
 */
function hideFirebaseValidation() {
  firebaseValidationEl.textContent = '';
  firebaseValidationEl.classList.remove('visible');
  firebaseUrlInput.setAttribute('aria-invalid', 'false');
}

// Theme Management
/**
 * Gets the current theme from the document
 * @returns {string} - The current theme ('dark' or 'light')
 */
const getCurrentTheme = () => document.documentElement.getAttribute('data-theme');

/**
 * Sets the theme and updates related elements
 * @param {string} theme - The theme to set ('dark' or 'light')
 */
const setTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
  themeToggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
};

// Initialize theme from localStorage or default to dark
const savedTheme = localStorage.getItem('theme') || 'dark';
setTheme(savedTheme);

// Theme toggle event listener
themeToggle.addEventListener('click', () => {
  const currentTheme = getCurrentTheme();
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  showToast(`Switched to ${newTheme} theme`);
});

/**
 * Toast notification for user feedback
 * @param {string} message - The message to display
 * @param {string} type - The type of toast ('default', 'success', or 'error')
 * @param {number} duration - How long to show the toast in milliseconds
 */
function showToast(message, type = 'default', duration = 3000) {
  // Clear any existing toasts
  clearTimeout(toast.timeoutId);
  
  // Set content and show
  toast.textContent = message;
  toast.className = 'toast';
  if (type !== 'default') toast.classList.add(type);
  toast.classList.add('visible');
  
  // Hide after duration
  toast.timeoutId = setTimeout(() => {
    toast.classList.remove('visible');
  }, duration);
}

/**
 * Firebase Initialization
 * Sets up the Firebase connection and data synchronization
 * @param {string} url - The Firebase database URL
 * @returns {boolean} - Whether initialization was successful
 */
const initializeFirebase = (url) => {
  try {
    showLoader(true);
    const appSettings = { databaseURL: url };
    app = initializeApp(appSettings);
    database = getDatabase(app);
    animeInDB = ref(database, "anime");

    onValue(animeInDB, (snapshot) => {
      syncButton.classList.add('synced');

      if (snapshot.exists()) {
        animeList = [];
        snapshot.forEach((childSnapshot) => {
          animeList.push({
            id: childSnapshot.key,
            value: childSnapshot.val().value
          });
        });
        localStorage.setItem('animeList', JSON.stringify(animeList));
        renderAnimeList();
        showToast('Successfully synced with Firebase', 'success');
      } else {
        animeList = [];
        localStorage.setItem('animeList', JSON.stringify(animeList));
        renderAnimeList();
        showToast('Connected to Firebase, no data found', 'default');
      }
      showLoader(false);
    }, (error) => {
      syncButton.classList.remove('synced');
      console.error('Firebase sync error:', error);
      showToast('Failed to sync with Firebase', 'error');
      showLoader(false);
    });

    return true;
  } catch (error) {
    console.error("Firebase initialization error:", error);
    showToast('Failed to initialize Firebase', 'error');
    showLoader(false);
    return false;
  }
};

/**
 * Shows or hides the loader element
 * @param {boolean} show - Whether to show the loader
 */
function showLoader(show) {
  loader.style.display = show ? 'block' : 'none';
  loader.setAttribute('aria-hidden', show ? 'false' : 'true');
}

// Get Firebase URL from localStorage and initialize if available
const storedFirebaseUrl = localStorage.getItem('firebaseUrl');
if (storedFirebaseUrl) {
  initializeFirebase(storedFirebaseUrl);
} else {
  console.warn("No Firebase URL configured. Please use the Sync button to configure.");
}

// Display initial list
renderAnimeList();

// Event listeners with improved handling
inputFieldEl.addEventListener("input", debounce(function(event) {
  // Validate on input but don't show errors immediately
  validateAnimeInput(this.value);
}, 300));

inputFieldEl.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    addButtonEl.click();
  }
});

// Add button click handler
addButtonEl.addEventListener("click", function() {
  const inputValue = inputFieldEl.value.trim();
  
  if (!validateAnimeInput(inputValue)) {
    inputFieldEl.focus();
    return;
  }
  
  showLoader(true);
  
  const newAnime = {
    id: Date.now().toString(),
    value: inputValue
  };
  
  // Update localStorage
  animeList.push(newAnime);
  localStorage.setItem('animeList', JSON.stringify(animeList));
  
  // Push to Firebase if connected
  if (animeInDB) {
    push(animeInDB, newAnime)
      .then(() => {
        showToast('Item added successfully!', 'success');
      })
      .catch(error => {
        console.error("Error adding to Firebase:", error);
        showToast('Added locally only, Firebase sync failed', 'error');
      })
      .finally(() => {
        showLoader(false);
      });
  } else {
    showLoader(false);
    showToast('Item added locally', 'success');
  }
  
  clearInputField();
  renderAnimeList();
});

// Optimized clear all function with confirmation
clearAllBtn.addEventListener("click", debounce(function() {
  if (animeList.length === 0) {
    showToast('List is already empty!', 'default');
    return;
  }
  
  const confirmClear = confirm("Are you sure you want to clear all items? This cannot be undone!");
  
  if (confirmClear) {
    showLoader(true);
    
    // Clear Firebase if available
    const clearFirebase = animeInDB ? remove(animeInDB) : Promise.resolve();
    
    clearFirebase
      .then(() => {
    // Clear localStorage
    animeList = [];
    localStorage.setItem('animeList', JSON.stringify(animeList));
    renderAnimeList();
        showToast('All items cleared', 'success');
      })
      .catch(error => {
        console.error("Error clearing Firebase:", error);
        showToast('Failed to clear remote data', 'error');
      })
      .finally(() => {
        showLoader(false);
      });
  }
}, 300));

/**
 * Renders the anime list to the DOM
 * - Shows items if list has entries
 * - Shows empty state with helpful suggestions if empty
 */
function renderAnimeList() {
  clearList();
  
  if (animeList.length > 0) {
    // Create a document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    animeList.forEach(anime => {
      const item = createListItem(anime);
      fragment.appendChild(item);
    });
    
    listItem.appendChild(fragment);
  } else {
    const emptyItem = document.createElement("li");
    emptyItem.className = "empty-state";
    emptyItem.innerHTML = `
      Your anime list is empty!<br>Add your favorites
      <div class="empty-state-suggestion">
        Try popular titles like "Attack on Titan", "My Hero Academia", or "Demon Slayer"
      </div>
    `;
    
    // Add a small button to add a suggested anime directly
    const suggestionBtn = document.createElement("button");
    suggestionBtn.textContent = "Add a suggestion";
    suggestionBtn.className = "suggestion-btn";
    suggestionBtn.style.marginTop = "10px";
    suggestionBtn.style.padding = "6px 12px";
    suggestionBtn.style.borderRadius = "6px";
    suggestionBtn.style.backgroundColor = "var(--color-primary)";
    suggestionBtn.style.color = "white";
    suggestionBtn.style.border = "none";
    suggestionBtn.style.fontSize = "11px";
    suggestionBtn.style.cursor = "pointer";
    
    suggestionBtn.addEventListener("click", function() {
      const suggestions = ["Attack on Titan", "My Hero Academia", "Demon Slayer", "One Piece", "Naruto", "Jujutsu Kaisen"];
      const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
      inputFieldEl.value = randomSuggestion;
      addButtonEl.click();
    });
    
    emptyItem.appendChild(suggestionBtn);
    listItem.appendChild(emptyItem);
  }
}

/**
 * Clears the list element of all children
 */
function clearList() {
  listItem.innerHTML = "";
}

/**
 * Clears the input field and sets focus to it
 */
function clearInputField() {
  inputFieldEl.value = "";
  inputFieldEl.focus();
}

/**
 * Creates a list item element for an anime entry
 * @param {Object} item - The anime item data
 * @param {string} item.id - The unique ID of the anime
 * @param {string} item.value - The anime title
 * @returns {HTMLLIElement} - The list item element
 */
function createListItem(item) {
  const newItem = document.createElement("li");
  newItem.textContent = item.value;
  newItem.setAttribute('data-id', item.id);
  newItem.setAttribute('tabindex', '0');
  newItem.setAttribute('role', 'button');
  newItem.setAttribute('aria-label', `${item.value}, double click to remove`);

  // Remove item functionality
  const removeItem = () => {
    showLoader(true);
    
    // Remove from Firebase if available
    const removePromise = database && animeInDB
      ? remove(ref(database, `anime/${item.id}`))
      : Promise.resolve();
    
    removePromise
      .then(() => {
    // Remove from local storage and update UI
    animeList = animeList.filter(anime => anime.id !== item.id);
    localStorage.setItem('animeList', JSON.stringify(animeList));
        newItem.classList.add('fade-exit');
        
        // Use animation end event for smooth removal
        setTimeout(() => {
    renderAnimeList();
          showToast('Item removed', 'success');
        }, 300);
      })
      .catch(error => {
        console.error("Error removing item:", error);
        showToast('Failed to remove item', 'error');
      })
      .finally(() => {
        showLoader(false);
      });
  };

  // Touch support for mobile
  let lastTouchTime = 0;
  newItem.addEventListener("touchend", function(e) {
    const now = Date.now();
    if (now - lastTouchTime < 300) {
      e.preventDefault();
      removeItem();
    }
    lastTouchTime = now;
  });

  // Double-click for desktop
  newItem.addEventListener("dblclick", removeItem);

  // Keyboard support (Enter or Space)
  newItem.addEventListener("keydown", function(e) {
    // Check for Enter (13) or Space (32)
    if (e.keyCode === 13 || e.keyCode === 32) {
      e.preventDefault();
      
      if (e.ctrlKey || e.metaKey) {
        // With modifier key, remove item 
        removeItem();
      } else {
        // Without modifier, we'll simulate a double click with a small delay
        newItem.classList.add('item-focus');
        setTimeout(() => {
          newItem.classList.remove('item-focus');
          removeItem();
        }, 300);
      }
    }
  });

  return newItem;
}

// Sync functionality
syncButton.addEventListener('click', function() {
  if (this.classList.contains('synced')) {
    this.classList.remove('synced');
    showToast('Device unsynced. Data will not be updated.', 'default');
    } else {
    showModal();
  }
});

/**
 * Opens the Firebase configuration modal
 */
function showModal() {
        modalOverlay.style.display = 'block';
  modalOverlay.setAttribute('aria-hidden', 'false');
  
  setTimeout(() => {
    modalOverlay.classList.add('active');
  }, 10);
  
  // Fill with saved URL if available
        const savedUrl = localStorage.getItem('firebaseUrl');
        if (savedUrl) {
            firebaseUrlInput.value = savedUrl;
        }
  
  // Focus on the input
  setTimeout(() => {
    firebaseUrlInput.focus();
  }, 300);
  
  // Set initial focus trap
  trapFocus(modalOverlay);
}

/**
 * Closes the Firebase configuration modal
 */
function hideModal() {
  modalOverlay.classList.remove('active');
  modalOverlay.setAttribute('aria-hidden', 'true');
  
  setTimeout(() => {
    modalOverlay.style.display = 'none';
  }, 300);
}

// Close modal handlers
[closeModal, cancelConfig].forEach(element => {
  element.addEventListener('click', () => {
    hideModal();
  });
});

// Close when clicking outside the modal
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    hideModal();
  }
});

// Prevent modal close when clicking inside
document.querySelector('.modal').addEventListener('click', (e) => {
  e.stopPropagation();
});

// Help icon - opens Firebase docs
helpIcon.addEventListener('click', () => {
  window.open('https://firebase.google.com/docs/database/web/start', '_blank');
});

// Form validation for Firebase configuration
firebaseForm.addEventListener('submit', function(e) {
  e.preventDefault();
  saveConfig.click();
});

// Save Firebase configuration
saveConfig.addEventListener('click', debounce(() => {
  const url = firebaseUrlInput.value.trim();
  
  if (!url) {
    showFirebaseValidation('Please enter a Firebase URL');
    return;
  }
  
  // Validate Firebase URL format
  if (!url.match(/^https:\/\/.+-default-rtdb\.firebaseio\.com\/?$/)) {
    showFirebaseValidation('Please enter a valid Firebase Realtime Database URL');
    return;
  }
  
  hideFirebaseValidation();
  localStorage.setItem('firebaseUrl', url);
  hideModal();
  
  // Initialize with new URL
  if (initializeFirebase(url)) {
    showToast('Firebase configuration updated successfully!', 'success');
  }
}, 300));

/**
 * Trap focus within a modal dialog for better accessibility
 * @param {HTMLElement} element - The container to trap focus in
 */
function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  element.addEventListener('keydown', function(e) {
    // If Escape is pressed, close the modal
    if (e.key === 'Escape') {
      hideModal();
      return;
    }
    
    // Check for Tab key
    if (e.key === 'Tab') {
      // If shift + tab and on first element, go to last
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } 
      // If tab and on last element, go to first
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  });
}

// Add keyboard support for the modal
firebaseUrlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    saveConfig.click();
  }
});

// Performance optimization: Add passive event listeners
document.addEventListener('touchstart', function() {}, { passive: true });
window.addEventListener('scroll', function() {}, { passive: true });

// Service worker registration for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

// TODO: Minify this JavaScript file during production build

