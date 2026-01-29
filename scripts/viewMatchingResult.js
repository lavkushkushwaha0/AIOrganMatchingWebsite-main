import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getDatabase, ref, child, get } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// Firebase Config
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
const db = getDatabase(app);
const dbRef = ref(db);
const tbody = document.querySelector("tbody");

const organMap = {
  "Kidney": 1, "Heart": 2, "Liver": 3, "Lungs": 4,
  "Pancreas": 5, "Cornea": 6
};

const bloodGroupMap = {
  "A+": 1, "A-": 2, "B+": 3, "B-": 4,
  "AB+": 5, "AB-": 6, "O+": 7, "O-": 8
};

// Show loading message
tbody.innerHTML = `<tr><td colspan="10" style="text-align: center;">Loading matching results...</td></tr>`;

// Function to send data to Flask API
async function getPrediction(data) {
  try {
    const response = await fetch("http://127.0.0.1:5000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      console.error("API response error:", response.status);
      return null;
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
}

// Function to fetch, match and render table
async function processData() {
  try {
    const [donorsSnap, recipientsSnap] = await Promise.all([
      get(child(dbRef, "donors")),
      get(child(dbRef, "recipients"))
    ]);

    if (!donorsSnap.exists() || !recipientsSnap.exists()) {
      tbody.innerHTML = `<tr><td colspan="10">No donor or recipient data found.</td></tr>`;
      return;
    }

    const donors = Object.values(donorsSnap.val());
    const recipients = Object.values(recipientsSnap.val());

    tbody.innerHTML = ""; // Clear previous rows

    for (let recipient of recipients) {
      for (let donor of donors) {
        const bloodMatch = donor.bloodGroup?.trim() === recipient.bloodGroup?.trim();
        const organMatch = donor.organ?.trim().toLowerCase() === recipient.organ?.trim().toLowerCase();
        const ageDiff = Math.abs(parseInt(donor.age) - parseInt(recipient.age));

        if (bloodMatch && organMatch && ageDiff <= 10) {
          const predictionRequest = {
            donor_age: parseInt(donor.age),
            recipient_age: parseInt(recipient.age),
            organ_code: organMap[donor.organ],
            blood_code: bloodGroupMap[donor.bloodGroup]
          };

          const prediction = await getPrediction(predictionRequest);

          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${recipient.name}</td>
            <td>${donor.name}</td>
            <td>${donor.bloodGroup}</td>
            <td>${donor.organ}</td>
            <td>${donor.age}</td>
            <td>${recipient.age}</td>
            <td>${donor.contact}</td>
            <td>${prediction?.compatibilityPercentage || 0}%</td>
            <td>${prediction?.surgerySuccess || 0}%</td>
            <td>${prediction?.deathRisk || 0}%</td>
          `;
          tbody.appendChild(row);
        }
      }
    }
  } catch (error) {
    console.error("Data processing error:", error);
    tbody.innerHTML = `<tr><td colspan="10">Error processing data. Check console.</td></tr>`;
  }
}

processData();
