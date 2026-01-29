import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDdAZtcznGNsuYvI6HmLLHRBdIwo3mb4MU",
  authDomain: "aiorganmatchingsystem.firebaseapp.com",
  databaseURL: "https://aiorganmatchingsystem-default-rtdb.firebaseio.com",
  projectId: "aiorganmatchingsystem",
  storageBucket: "aiorganmatchingsystem.appspot.com",
  messagingSenderId: "68131913364",
  appId: "1:68131913364:web:1c0a666f10fb02d9513e81",
  measurementId: "G-ZPPM0XBWM4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Payload for recipient data
    const recipientData = {
      name: document.getElementById("name").value,
      age: document.getElementById("age").value,
      bloodGroup: document.getElementById("blood-group").value,
      organ: document.getElementById("organ").value,
      contact: document.getElementById("contact").value,
    };

    // Push data to Firebase under 'recipients'
    const recipientsRef = ref(database, "recipients");
    const newRecipientRef = push(recipientsRef);

    set(newRecipientRef, recipientData)
      .then(() => {
        alert("Recipient registered successfully!");
        form.reset();
      })
      .catch((error) => {
        console.error("Error writing to Firebase:", error);
        alert("Something went wrong. Please try again.");
      });
  });
});
