// Configuration
const API_BASE_URL = "/api";

// State
let html5QrCode;
let currentStudentId = null;
let currentStudentData = null;
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

function onScanSuccess(decodedText, decodedResult) {
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
        currentStudentData = data.student;
        showStudentProfile(currentStudentData);
        showStatus("Student found! Recording attendance...", "success");
        markAttendance();
      } else {
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

function showStudentProfile(student) {
  document.getElementById("studentProfile").classList.add("active");

  document.getElementById("profileName").textContent = student.fullName;
  document.getElementById("profileId").textContent = student.studentId;
  document.getElementById("profileAge").textContent = student.age;
  document.getElementById("profileGender").textContent = student.gender;
  document.getElementById("profileGrade").textContent = student.grade;
  document.getElementById("profileChurch").textContent = student.church;
  document.getElementById("profileYear").textContent = student.vcsYear;

  const attendanceList = document.getElementById("attendanceList");
  attendanceList.innerHTML = "";

  if (student.attendance && student.attendance.length > 0) {
    student.attendance.forEach((date) => {
      const dayDiv = document.createElement("div");
      dayDiv.className = "attendance-day";
      dayDiv.textContent = new Date(date).toLocaleDateString();
      attendanceList.appendChild(dayDiv);
    });
  } else {
    attendanceList.innerHTML =
      '<p style="color: #999;">No attendance records yet</p>';
  }

  document
    .querySelectorAll(".tag")
    .forEach((tag) => tag.classList.remove("active"));
  if (student.tags) {
    student.tags.forEach((tag) => {
      const tagElement = document.querySelector(`.tag.${tag}`);
      if (tagElement) tagElement.classList.add("active");
    });
  }

  const today = new Date().toISOString().split("T")[0];
  const isPresentToday =
    student.attendance &&
    student.attendance.some((date) =>
      new Date(date).toISOString().startsWith(today),
    );

  const badge = document.getElementById("attendanceBadge");
  if (isPresentToday) {
    badge.textContent = "✓ Present Today";
    badge.classList.remove("absent");
  } else {
    badge.textContent = "Not Checked In";
    badge.classList.add("absent");
  }
}

function markAttendance() {
  if (!currentStudentId) return;

  showSpinner(true);

  fetch(`${API_BASE_URL}/students/${currentStudentId}/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date: new Date().toISOString() }),
  })
    .then((response) => response.json())
    .then((data) => {
      showSpinner(false);

      if (data.alreadyMarked) {
        showStatus("Already marked present today!", "info");
      } else {
        showStatus("Attendance marked successfully for today!", "success");
      }

      const badge = document.getElementById("attendanceBadge");
      badge.textContent = "✓ Present Today";
      badge.classList.remove("absent");

      if (currentStudentData) {
        if (!currentStudentData.attendance) currentStudentData.attendance = [];
        if (!data.alreadyMarked) {
          currentStudentData.attendance.push(new Date().toISOString());
        }
        showStudentProfile(currentStudentData);
      }
    })
    .catch((error) => {
      showSpinner(false);
      showStatus("Error marking attendance. Please try again.", "error");
      console.error("Error:", error);
    });
}

function toggleTag(tagName) {
  const tagElement = document.querySelector(`.tag.${tagName}`);
  const isActive = tagElement.classList.contains("active");

  tagElement.classList.toggle("active");

  fetch(`${API_BASE_URL}/students/${currentStudentId}/tags`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tag: tagName,
      action: isActive ? "remove" : "add",
    }),
  }).catch((error) => {
    console.error("Tag update error:", error);
  });

  if (!currentStudentData.tags) currentStudentData.tags = [];

  if (isActive) {
    currentStudentData.tags = currentStudentData.tags.filter(
      (t) => t !== tagName,
    );
  } else {
    currentStudentData.tags.push(tagName);
  }
}

function resetScanner() {
  document.getElementById("studentProfile").classList.remove("active");
  document.getElementById("scanResult").classList.remove("active");
  document.getElementById("scannerSection").style.display = "block";
  document.getElementById("manualStudentId").value = "";
  document.getElementById("manualEntry").classList.remove("active");

  if (html5QrCode) {
    html5QrCode.resume();
    isScanning = true;
  }

  currentStudentId = null;
  currentStudentData = null;
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
