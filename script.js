let data = [];
let currentUserEmail = "Guest";

// Your Google Script Deployment URL
const scriptURL = "https://script.google.com/macros/s/AKfycbxTzFIX6K7a5L_qopkrjTGTvKv1pV6_TonqnfbUFtG6pWdFR7dsyhn82g6H-vYrhsvx/exec";

// --- 1. INITIALIZE LOGIN ---
window.onload = function () {
  google.accounts.id.initialize({
    // Your specific Client ID
    client_id: "684419504896-grfb9t1gdj7jfkdk2c6ns3aeptkbd17f.apps.googleusercontent.com",
    callback: handleCredentialResponse
  });

  google.accounts.id.renderButton(
    document.getElementById("buttonDiv"),
    { theme: "outline", size: "large", width: "250" } 
  );
};

// --- 2. GOOGLE LOGIN HANDLER ---
function handleCredentialResponse(response) {
  const responsePayload = parseJwt(response.credential);

  const loggedInEmail = responsePayload.email.toLowerCase();
  // !!! IMPORTANT: Add your email to this list !!!
  const authorizedUsers = ["efrancisalbert@gmail.com", "francisalbertespina@gmail.com", "sanpabloshan@gmail.com"];
  
  if (authorizedUsers.includes(responsePayload.email)) {
    currentUserEmail = responsePayload.email;
    
    // Switch visibility: Hide login, show form
    document.getElementById("login-section").style.display = "none";
    document.getElementById("form-section").style.display = "block";
    
    const statusText = document.getElementById("status");
    statusText.innerText = "Welcome, " + responsePayload.name;
    statusText.style.color = "#2e7d32";
  } else {
    alert("Unauthorized user: " + responsePayload.email + ". Access Denied.");
  }
}

// Token parser (converts Google login data into a readable name/email)
function parseJwt(token) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(jsonPayload);
}

// --- 3. DATA ENTRY HANDLER ---
async function addEntry() {
  const date = document.getElementById("date").value;
  const volume = document.getElementById("volume").value;
  const waste = document.getElementById("waste").value;
  const statusText = document.getElementById("status");

  if (!date || !volume || !waste) {
    alert("Please complete all fields");
    return;
  }

  const rowData = {
    date: date,
    volume: volume,
    waste: waste,
    userEmail: currentUserEmail 
  };

  statusText.innerText = "Syncing with Google Sheets...";
  statusText.style.color = "#1976d2";

  // Send to Google Sheets
  fetch(scriptURL, {
    method: 'POST',
    mode: 'no-cors', 
    cache: 'no-cache',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rowData)
  })
  .then(() => {
    statusText.innerText = "✅ Successfully saved to Cloud";
    statusText.style.color = "#2e7d32";
    setTimeout(() => { statusText.innerText = "Logged in as: " + currentUserEmail; }, 3000);
  })
  .catch(error => {
    statusText.innerText = "❌ Sync Error";
    console.error("Error!", error.message);
  });

  // Update table
  data.push(rowData);
  const tbody = document.querySelector("#table tbody");
  const row = tbody.insertRow(0);
  row.insertCell(0).innerText = date;
  row.insertCell(1).innerText = volume;
  row.insertCell(2).innerText = waste;

  // Clear inputs
  document.getElementById("date").value = "";
  document.getElementById("volume").value = "";
  document.getElementById("waste").value = "";
}

// --- 4. EXPORT HANDLER ---
function exportExcel() {
  if (data.length === 0) {
    alert("No data to export!");
    return;
  }
  let csv = "Date,Volume (kg),Waste Name,Logged By\n";
  data.forEach(row => {
    csv += `"${row.date}","${row.volume}","${row.waste}","${row.userEmail}"\n`;
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `waste_log_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

