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

// Add loading indicator
tbody.innerHTML = `<tr><td colspan="10" style="text-align: center;">Loading data...</td></tr>`;

// Mappings
const organMap = {
  "Kidney": 1, "Heart": 2, "Liver": 3, "Lungs": 4,
  "Pancreas": 5, "Cornea": 6
};

const bloodGroupMap = {
  "A+": 1, "A-": 2, "B+": 3, "B-": 4,
  "AB+": 5, "AB-": 6, "O+": 7, "O-": 8
};

// Clear the table before adding new data
function clearTable() {
  tbody.innerHTML = '';
}

// Display error message in the table
function showError(message) {
  tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: red;">${message}</td></tr>`;
}

// Function to render a single match row
function renderMatchRow(donor, recipient, predictionData) {
  const row = document.createElement("tr");
  
  // Set default values for prediction data in case the API call failed
  const compatibility = predictionData?.compatibility !== undefined ? predictionData.compatibility : false;
  const surgerySuccess = predictionData?.surgerySuccess !== undefined ? `${predictionData.surgerySuccess}%` : "N/A";
  const deathRisk = predictionData?.deathRisk !== undefined ? `${predictionData.deathRisk}%` : "N/A";
  
  row.innerHTML = `
    <td>${recipient.name || 'Unknown'}</td>
    <td>${donor.name || 'Unknown'}</td>
    <td>${donor.bloodGroup || 'Unknown'}</td>
    <td>${donor.organ || 'Unknown'}</td>
    <td>${donor.age || 'Unknown'}</td>
    <td>${recipient.age || 'Unknown'}</td>
    <td>${donor.contact || 'Unknown'}</td>
    <td>${compatibility ? "Yes" : "No"}</td>
    <td>${surgerySuccess}</td>
    <td>${deathRisk}</td>
  `;
  
  tbody.appendChild(row);
}

// Function to call the prediction API
async function getPrediction(requestBody) {
  try {
    console.log("Sending to /predict API:", requestBody);
    
    const response = await fetch("http://127.0.0.1:5000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      console.error(`API responded with status: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    console.log("API Response:", data);
    return data;
    
  } catch (error) {
    console.error("API Prediction Error:", error);
    return null;
  }
}

// Main function to fetch and process data
async function fetchAndMatchData() {
  try {
    clearTable();
    
    // Fetch data from Firebase
    const [donorSnap, recipientSnap] = await Promise.all([
      get(child(dbRef, "donors")),
      get(child(dbRef, "recipients"))
    ]);
    
    if (!donorSnap.exists() || !recipientSnap.exists()) {
      showError("No donors or recipients data found.");
      return;
    }
    
    const donors = Object.values(donorSnap.val() || {});
    const recipients = Object.values(recipientSnap.val() || {});
    
    if (donors.length === 0 || recipients.length === 0) {
      showError("Either donors or recipients list is empty.");
      return;
    }
    
    // Find potential matches
    const matches = [];
    
    recipients.forEach(recipient => {
      donors.forEach(donor => {
        // Basic matching criteria
        const bloodMatch = recipient.bloodGroup?.trim() === donor.bloodGroup?.trim();
        const organMatch = recipient.organ?.trim().toLowerCase() === donor.organ?.trim().toLowerCase();
        
        // Parse ages with fallback to 0 if undefined
        const donorAge = parseInt(donor.age || '0');
        const recipientAge = parseInt(recipient.age || '0');
        const ageDiff = Math.abs(donorAge - recipientAge);
        
        if (bloodMatch && organMatch && ageDiff <= 10) {
          matches.push({ donor, recipient });
        }
      });
    });
    
    if (matches.length === 0) {
      showError("No matched donors found for any recipient.");
      return;
    }
    
    // Process each match
    clearTable(); // Clear loading message
    
    for (const match of matches) {
      const { donor, recipient } = match;
      
      // Prepare request body for prediction API
      const requestBody = {
        donor_age: parseInt(donor.age || '0'),
        recipient_age: parseInt(recipient.age || '0'),
        organ_code: organMap[donor.organ] || 1,
        blood_code: bloodGroupMap[donor.bloodGroup] || 1
      };
      
      // Call prediction API
      const predictionData = await getPrediction(requestBody);
      
      // Render the match row with available data
      renderMatchRow(donor, recipient, predictionData);
    }
    
  } catch (error) {
    console.error("Error processing data:", error);
    showError("Error processing data. Check console for details.");
  }
}

// Start the process
fetchAndMatchData();