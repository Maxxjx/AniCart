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
const database = getDatabase(app);
const animeInDB = ref(database, "anime");

const inputFieldEl = document.getElementById("inputel");
const addButtonEl = document.getElementById("add");
const listItem = document.getElementById("list");

addButtonEl.addEventListener("click", function () {
  let inputValue = inputFieldEl.value;

  push(animeInDB, inputValue);

  console.log(`${inputValue} added to database`);
  clearlinputfield();
});

onValue(animeInDB, function (snapshot) {
  if (snapshot.exists()) {
    let animeListArray = Object.entries(snapshot.val());

    clearlist();

    for (let i = 0; i < animeListArray.length; i++) {
      let currentAnimeArray = animeListArray[i];

      addlist(currentAnimeArray);
    }
  } else {
    listItem.innerHTML += `<li>Don't Be Lazy....<br> Add some Animes <strong>Baka !!!</strong></li>`;
  }
});

function clearlist() {
  listItem.innerHTML = "";
}

function clearlinputfield() {
  inputFieldEl.value = "";
}

function addlist(item) {
  let itemId = item[0];
  let itemValue = item[1];

  let newItem = document.createElement("li");

  newItem.textContent = itemValue;

  newItem.addEventListener("dblclick", function () {
    let locationofIdInDB = ref(database, `anime/${itemId}`);

    remove(locationofIdInDB);
  });

  listItem.append(newItem);
}
