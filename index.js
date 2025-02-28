import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

const appSettings = {
  databaseURL: "https://anilist-845d2-default-rtdb.firebaseio.com/",
};

const app = initializeApp(appSettings);
let database = getDatabase(app);
let animeInDB = ref(database, "anime");

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
  
  // Generate a unique ID using timestamp
  const newAnime = {
    id: Date.now().toString(),
    value: inputValue
  };
  
  animeList.push(newAnime);
  localStorage.setItem('animeList', JSON.stringify(animeList));
  
  console.log(`${inputValue} added to localStorage`);
  clearlinputfield();
  renderAnimeList();
});

clearAllBtn.addEventListener("click", function() {
    if (animeList.length === 0) {
        alert("List is already empty!");
        return;
    }
    
    const confirmClear = confirm("Are you sure you want to clear all items? This cannot be undone!");
    
    if (confirmClear) {
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

function clearlinputfield() {
  inputFieldEl.value = "";
}

function addlist(item) {
  let newItem = document.createElement("li");
  newItem.textContent = item.value;

  let lastTouchTime = 0;
  newItem.addEventListener("touchend", function(e) {
    const now = Date.now();
    if (now - lastTouchTime < 300) {
      // Double tap detected
      animeList = animeList.filter(anime => anime.id !== item.id);
      localStorage.setItem('animeList', JSON.stringify(animeList));
      renderAnimeList();
    }
    lastTouchTime = now;
  });

  newItem.addEventListener("dblclick", function () {
    // Remove item from array and update localStorage with double click from desktop
    animeList = animeList.filter(anime => anime.id !== item.id);
    localStorage.setItem('animeList', JSON.stringify(animeList));
    renderAnimeList();
  });

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

// Show modal
syncButton.addEventListener('click', () => {
  modalOverlay.style.display = 'block';
  const savedUrl = localStorage.getItem('firebaseUrl');
  if (savedUrl) {
    firebaseUrlInput.value = savedUrl;
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

