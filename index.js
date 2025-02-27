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

