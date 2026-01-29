document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.querySelector(".donor-details table tbody");

  fetch("https://aiorganmatchingsystem-default-rtdb.firebaseio.com/donors.json")  // Updated Firebase URL
    .then(response => response.json())
    .then(data => {
      if (!data) {
        tableBody.innerHTML = "<tr><td colspan='6'>No donor data available.</td></tr>";
        return;
      }
      console.log(data)

      // Convert the Firebase object into an array of donor objects
      const donors = Object.values(data);

      donors.forEach(donor => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${donor.name}</td>
          <td>${donor.age}</td>
          <td>${donor.gender}</td>
          <td>${donor.bloodGroup}</td>
          <td>${donor.organ}</td>
          <td>${donor.contact}</td>
        `;

        tableBody.appendChild(row);
      });
    })
    .catch(error => {
      console.error("Error fetching donor data:", error);
      tableBody.innerHTML = "<tr><td colspan='6'>Error loading data. Please try again later.</td></tr>";
    });
});
