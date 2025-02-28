import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

const appSettings = {
  databaseURL: localStorage.getItem('firebaseUrl'),
};

const app = initializeApp(appSettings);
let database = getDatabase(app);
let animeInDB = ref(database, "anime");

// After Firebase initialization, add this:
onValue(animeInDB, (snapshot) => {
    // Mark as synced when connection is established
    syncButton.classList.add('synced');
    syncButton.textContent = 'Synced';
    
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
    }
}, (error) => {
    // Remove synced state if there's an error
    syncButton.classList.remove('synced');
    syncButton.textContent = 'Sync';
    console.error('Firebase sync error:', error);
});

const inputFieldEl = document.getElementById("inputel");
const addButtonEl = document.getElementById("add");
const listItem = document.getElementById("list");
const clearAllBtn = document.getElementById("clear-all");

// Initialize from localStorage or empty array
let animeList = JSON.parse(localStorage.getItem('animeList')) || [];

// Display initial list
renderAnimeList();

inputFieldEl.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    addButtonEl.click();
  }
});

addButtonEl.addEventListener("click", function () {
  let inputValue = inputFieldEl.value;
  
  const newAnime = {
    id: Date.now().toString(),
    value: inputValue
  };
  
  // Update localStorage
  animeList.push(newAnime);
  localStorage.setItem('animeList', JSON.stringify(animeList));
  
  // Push to Firebase
  push(animeInDB, newAnime);
  
  clearInputField();
  renderAnimeList();
});

clearAllBtn.addEventListener("click", function() {
    if (animeList.length === 0) {
        alert("List is already empty!");
        return;
    }
    
    const confirmClear = confirm("Are you sure you want to clear all items? This cannot be undone!");
    
    if (confirmClear) {
        // Clear Firebase
        remove(animeInDB);
        
        // Clear localStorage
        animeList = [];
        localStorage.setItem('animeList', JSON.stringify(animeList));
        renderAnimeList();
    }
});

function renderAnimeList() {
  clearlist();
  
  if (animeList.length > 0) {
    animeList.forEach(anime => {
      addlist(anime);
    });
  } else {
    listItem.innerHTML += `<li>Don't Be Lazy....<br> Add some stuff <strong>Baka !!!</strong></li>`;
  }
}

function clearlist() {
  listItem.innerHTML = "";
}

function clearInputField() {
  inputFieldEl.value = "";
}

function addlist(item) {
  let newItem = document.createElement("li");
  newItem.textContent = item.value;

  const removeItem = () => {
    // Remove from Firebase
    const itemRef = ref(database, `anime/${item.id}`);
    remove(itemRef);
    
    // Remove from local storage
    animeList = animeList.filter(anime => anime.id !== item.id);
    localStorage.setItem('animeList', JSON.stringify(animeList));
    renderAnimeList();
  };

  let lastTouchTime = 0;
  newItem.addEventListener("touchend", function(e) {
    const now = Date.now();
    if (now - lastTouchTime < 300) {
      removeItem();
    }
    lastTouchTime = now;
  });

  newItem.addEventListener("dblclick", removeItem);

  listItem.append(newItem);
}

// Sync functionality
const syncButton = document.getElementById('syncButton');
const modalOverlay = document.getElementById('modalOverlay');
const closeModal = document.getElementById('closeModal');
const helpIcon = document.getElementById('helpIcon');
const firebaseUrlInput = document.getElementById('firebaseUrl');
const saveConfig = document.getElementById('saveConfig');
const cancelConfig = document.getElementById('cancelConfig');

// Remove duplicate syncButton event listener and merge sync logic:
syncButton.addEventListener('click', () => {
    if (syncButton.classList.contains('synced')) {
        syncButton.classList.remove('synced');
        syncButton.textContent = 'Sync';
        alert('Device unsynced. Data will not be updated.');
    } else {
        modalOverlay.style.display = 'block';
        const savedUrl = localStorage.getItem('firebaseUrl');
        if (savedUrl) {
            firebaseUrlInput.value = savedUrl;
        }
    }
});

// Close modal handlers
[closeModal, cancelConfig, modalOverlay].forEach(element => {
  element.addEventListener('click', (e) => {
    if (e.target === element) {
      modalOverlay.style.display = 'none';
    }
  });
});

// Prevent modal close when clicking inside
document.querySelector('.modal').addEventListener('click', (e) => {
  e.stopPropagation();
});

// Help icon
helpIcon.addEventListener('click', () => {
  window.open('https://firebase.google.com/docs/database/web/start', '_blank');
});

// Save configuration
saveConfig.addEventListener('click', () => {
  const url = firebaseUrlInput.value;
  
  // Validate Firebase URL format
  if (!url.match(/^https:\/\/.+-default-rtdb\.firebaseio\.com\/?$/)) {
    alert('Please enter a valid Firebase Realtime Database URL');
    return;
  }
  
  localStorage.setItem('firebaseUrl', url);
  appSettings.databaseURL = url;
  
  // Reinitialize Firebase with new URL
  const newApp = initializeApp(appSettings);
  database = getDatabase(newApp);
  animeInDB = ref(database, "anime");
  
  modalOverlay.style.display = 'none';
  alert('Firebase configuration updated successfully!');
});

