const API_BASE_URL = "/api";

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

// Load teachers when VCS year is typed
let yearTimeout;
function onYearChange(value) {
  clearTimeout(yearTimeout);
  const teacherSelect = document.getElementById("teacher");
  const hint = document.getElementById("teacherHint");

  if (value.length < 4) {
    teacherSelect.innerHTML = '<option value="">Enter VCS Year first</option>';
    hint.style.display = "none";
    return;
  }

  // Debounce — wait for user to stop typing
  yearTimeout = setTimeout(() => loadTeachers(value), 500);
}

function loadTeachers(vcsYear) {
  const teacherSelect = document.getElementById("teacher");
  const hint = document.getElementById("teacherHint");

  teacherSelect.innerHTML = '<option value="">Loading teachers...</option>';

  fetch(`${API_BASE_URL}/teachers?vcsYear=${encodeURIComponent(vcsYear)}`)
    .then((res) => res.json())
    .then((teachers) => {
      if (teachers.length === 0) {
        teacherSelect.innerHTML = '<option value="">No teachers found</option>';
        hint.style.display = "block";
      } else {
        hint.style.display = "none";
        teacherSelect.innerHTML = '<option value="">Select Teacher</option>';
        teachers.forEach((t) => {
          const option = document.createElement("option");
          option.value = t.name;
          option.textContent = t.name;
          teacherSelect.appendChild(option);
        });
      }
    })
    .catch(() => {
      teacherSelect.innerHTML =
        '<option value="">Error loading teachers</option>';
    });
}

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
    teacher: document.getElementById("teacher").value,
    attendance: [new Date().toISOString()],
    tags: [],
  };

  fetch(`${API_BASE_URL}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(studentData),
  })
    .then((res) => res.json())
    .then((data) => {
      showSpinner(false);
      if (data.error) {
        showStatus("Error: " + data.error, "error");
        return;
      }

      // Hide form, show success
      document.getElementById("registrationForm").classList.remove("active");
      document.getElementById("successProfile").classList.add("active");
      document.getElementById("successName").textContent = studentData.fullName;
      document.getElementById("successId").textContent = studentData.studentId;
      document.getElementById("successGrade").textContent = studentData.grade;
      document.getElementById("successTeacher").textContent =
        studentData.teacher;
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
