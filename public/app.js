// Configuration
const API_BASE_URL = "/api";

// State
let html5QrCode;
let currentStudentId = null;
let isScanning = false;

// Initialize Scanner
function initScanner() {
  html5QrCode = new Html5Qrcode("reader");

  const config = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0,
  };

  html5QrCode
    .start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
    .catch((err) => {
      showStatus("Error starting camera: " + err, "error");
      console.error("Camera error:", err);
    });

  isScanning = true;
}

function onScanSuccess(decodedText) {
  if (!isScanning) return;

  html5QrCode.pause();
  isScanning = false;

  document.getElementById("qrContent").textContent = decodedText;
  document.getElementById("scanResult").classList.add("active");

  processQrCode(decodedText);
}

function onScanFailure(error) {
  // suppress scan errors
}

function processQrCode(qrData) {
  showSpinner(true);

  let studentId = qrData.trim();

  // If QR contains a URL, extract just the ID at the end
  if (studentId.includes("/")) {
    const parts = studentId.split("/");
    studentId = parts[parts.length - 1];
  }

  currentStudentId = studentId;
  lookupStudent(studentId);
}

function lookupStudent(studentId) {
  fetch(`${API_BASE_URL}/students/${studentId}`)
    .then((response) => response.json())
    .then((data) => {
      showSpinner(false);

      if (data.exists) {
        // Existing student — redirect to profile page
        showStatus("Student found! Redirecting to profile...", "success");
        setTimeout(() => {
          window.location.href = `/profile.html?id=${encodeURIComponent(studentId)}`;
        }, 800);
      } else {
        // New student — redirect to registration page
        showStatus(
          "New student detected. Redirecting to registration...",
          "info",
        );
        setTimeout(() => {
          window.location.href = `/register.html?id=${encodeURIComponent(studentId)}`;
        }, 800);
      }
    })
    .catch((error) => {
      showSpinner(false);
      showStatus("Error connecting to server. Please try again.", "error");
      console.error("Error:", error);
    });
}

function lookupManualId() {
  const id = document.getElementById("manualStudentId").value.trim();
  if (!id) {
    showStatus("Please enter a Student ID", "error");
    return;
  }
  processQrCode(id);
}

function toggleManualEntry() {
  document.getElementById("manualEntry").classList.toggle("active");
}

function showSpinner(show) {
  document.getElementById("spinner").classList.toggle("active", show);
}

function showStatus(message, type) {
  const statusEl = document.getElementById("statusMessage");
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;

  setTimeout(() => {
    statusEl.className = "status-message";
  }, 5000);
}

window.onload = function () {
  initScanner();
};

window.onbeforeunload = function () {
  if (html5QrCode) {
    html5QrCode.stop().catch(console.error);
  }
};
