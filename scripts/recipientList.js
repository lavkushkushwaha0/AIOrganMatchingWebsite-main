document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.querySelector(".recipient-table tbody");

  fetch("https://aiorganmatchingsystem-default-rtdb.firebaseio.com/recipients.json")  // Firebase recipients path
    .then(response => response.json())
    .then(data => {
      if (!data) {
        tableBody.innerHTML = "<tr><td colspan='5'>No recipient data available.</td></tr>";
        return;
      }

      console.log(data); // for debugging

      const recipients = Object.values(data);

      recipients.forEach(recipient => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${recipient.name}</td>
          <td>${recipient.age}</td>
          <td>${recipient.bloodGroup}</td>
          <td>${recipient.organ}</td>
          <td>${recipient.contact}</td>
        `;

        tableBody.appendChild(row);
      });
    })
    .catch(error => {
      console.error("Error fetching recipient data:", error);
      tableBody.innerHTML = "<tr><td colspan='5'>Error loading data. Please try again later.</td></tr>";
    });
});
