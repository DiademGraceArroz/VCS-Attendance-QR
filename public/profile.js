const API_BASE_URL = "/api";

// Read student ID from URL: /profile.html?id=VCS2025001
const params = new URLSearchParams(window.location.search);
const studentId = params.get("id");
let studentData = null;

window.onload = function () {
  if (!studentId) {
    showStatus("No Student ID provided. Redirecting to scanner...", "error");
    setTimeout(() => {
      window.location.href = "/";
    }, 2000);
    return;
  }

  loadStudentProfile();
};

function loadStudentProfile() {
  showSpinner(true);

  fetch(`${API_BASE_URL}/students/${studentId}`)
    .then((response) => response.json())
    .then((data) => {
      showSpinner(false);

      if (!data.exists) {
        showStatus("Student not found. Redirecting to scanner...", "error");
        setTimeout(() => (window.location.href = "/"), 2000);
        return;
      }

      studentData = data.student;
      renderProfile(studentData);

      // Auto-mark attendance on page load
      markAttendance();
    })
    .catch((error) => {
      showSpinner(false);
      showStatus("Error loading student profile. Please try again.", "error");
      console.error("Error:", error);
    });
}

function renderProfile(student) {
  document.getElementById("profileName").textContent = student.fullName;
  document.getElementById("profileId").textContent = student.studentId;
  document.getElementById("profileAge").textContent = student.age;
  document.getElementById("profileGender").textContent = student.gender;
  document.getElementById("profileGrade").textContent = student.grade;
  document.getElementById("profileChurch").textContent = student.church;
  document.getElementById("profileYear").textContent = student.vcsYear;
  document.getElementById("profileTeacher").textContent =
    student.teacher || "N/A";

  // Attendance history
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
      '<p style="color:#999;">No attendance records yet</p>';
  }

  // Reset then set active tags
  document
    .querySelectorAll(".tag")
    .forEach((tag) => tag.classList.remove("active"));
  if (student.tags) {
    student.tags.forEach((tag) => {
      const tagElement = document.querySelector(`.tag.${tag}`);
      if (tagElement) tagElement.classList.add("active");
    });
  }

  // Attendance badge
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
  showSpinner(true);

  fetch(`${API_BASE_URL}/students/${studentId}/attendance`, {
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
        // Add today to local attendance list
        if (studentData) {
          if (!studentData.attendance) studentData.attendance = [];
          studentData.attendance.push(new Date().toISOString());
          renderProfile(studentData);
        }
      }

      const badge = document.getElementById("attendanceBadge");
      badge.textContent = "✓ Present Today";
      badge.classList.remove("absent");
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

  fetch(`${API_BASE_URL}/students/${studentId}/tags`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tag: tagName,
      action: isActive ? "remove" : "add",
    }),
  }).catch((error) => {
    console.error("Tag update error:", error);
  });

  if (!studentData.tags) studentData.tags = [];

  if (isActive) {
    studentData.tags = studentData.tags.filter((t) => t !== tagName);
  } else {
    studentData.tags.push(tagName);
  }
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
