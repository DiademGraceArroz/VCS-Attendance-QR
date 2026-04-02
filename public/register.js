const API_BASE_URL = "/api";

// Read student ID from URL query param: /register.html?id=VCS2026001
const params = new URLSearchParams(window.location.search);
const studentId = params.get("id");

window.onload = function () {
  if (!studentId) {
    showStatus("No Student ID provided. Please scan a QR code first.", "error");
    setTimeout(() => {
      window.location.href = "/";
    }, 2000);
    return;
  }

  document.getElementById("newStudentId").textContent = studentId;
};

function registerStudent(event) {
  event.preventDefault();
  showSpinner(true);

  const studentData = {
    studentId: studentId,
    fullName: document.getElementById("fullName").value,
    age: parseInt(document.getElementById("age").value),
    gender: document.getElementById("gender").value,
    grade: document.getElementById("grade").value,
    address: document.getElementById("address").value,
    church: document.getElementById("church").value,
    vcsYear: document.getElementById("vcsYear").value,
    attendance: [new Date().toISOString()],
    tags: [],
  };

  fetch(`${API_BASE_URL}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(studentData),
  })
    .then((response) => response.json())
    .then((data) => {
      showSpinner(false);

      if (data.error) {
        showStatus("Error: " + data.error, "error");
        return;
      }

      // Hide form, show success profile
      document.getElementById("registrationForm").classList.remove("active");
      const profile = document.getElementById("successProfile");
      profile.classList.add("active");

      document.getElementById("successName").textContent = studentData.fullName;
      document.getElementById("successId").textContent = studentData.studentId;
      document.getElementById("successGrade").textContent = studentData.grade;
      document.getElementById("successChurch").textContent = studentData.church;
      document.getElementById("successYear").textContent = studentData.vcsYear;

      showStatus(
        "Student registered successfully! Attendance marked for today.",
        "success",
      );
    })
    .catch((error) => {
      showSpinner(false);
      showStatus("Error registering student. Please try again.", "error");
      console.error("Error:", error);
    });
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
