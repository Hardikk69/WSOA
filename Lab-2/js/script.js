// =========================================================
// CampusConnect - Lab 2 REST API Integration
// JSONPlaceholder API + JavaScript fetch()
// =========================================================


// JSONPlaceholder API endpoints
const API = {
    profile: "https://jsonplaceholder.typicode.com/users/1",

    announcements:
        "https://jsonplaceholder.typicode.com/posts?_limit=5",

    assignments:
        "https://jsonplaceholder.typicode.com/todos?userId=1&_limit=5"
};


// Store API data so it can be filtered without making
// unnecessary API requests.
let announcementsData = [];
let assignmentsData = [];


// Wait until the page has loaded
window.onload = function () {

    // -----------------------------------------------------
    // 1. Dark Mode / Theme Toggle
    // -----------------------------------------------------

    const themeBtn = document.getElementById("theme-btn");

    themeBtn.onclick = function () {

        document.body.classList.toggle("dark-theme");

        if (document.body.classList.contains("dark-theme")) {
            themeBtn.textContent = "Switch to Light Mode";
        } else {
            themeBtn.textContent = "Switch to Dark Mode";
        }
    };


    // -----------------------------------------------------
    // 2. Greeting and Live Clock
    // -----------------------------------------------------

    function updateClock() {

        const today = new Date();

        // Display current time
        const clockElement = document.getElementById("live-time");

        clockElement.textContent =
            today.toLocaleTimeString();


        // Calculate greeting
        const hours = today.getHours();

        const greetingText =
            document.getElementById("greeting-text");


        if (hours < 12) {

            greetingText.textContent =
                "Good Morning, Hardik Kansara!";

        } else if (hours < 18) {

            greetingText.textContent =
                "Good Afternoon, Hardik Kansara!";

        } else {

            greetingText.textContent =
                "Good Evening, Hardik Kansara!";
        }
    }


    updateClock();

    setInterval(updateClock, 1000);


    // -----------------------------------------------------
    // 3. Quick Services Search
    // -----------------------------------------------------

    const searchBox =
        document.getElementById("service-search");


    searchBox.onkeyup = function () {

        const filter =
            searchBox.value.toLowerCase();

        const services =
            document.getElementsByClassName("service-item");


        for (let i = 0; i < services.length; i++) {

            const item = services[i];

            const serviceName =
                item.textContent.toLowerCase();


            if (serviceName.indexOf(filter) > -1) {

                item.style.display = "block";

            } else {

                item.style.display = "none";
            }
        }
    };


    // -----------------------------------------------------
    // 4. Service Click Interaction
    // -----------------------------------------------------

    const services =
        document.getElementsByClassName("service-item");


    for (let i = 0; i < services.length; i++) {

        services[i].onclick = function () {

            alert(
                "Clicked: " +
                this.textContent.trim()
            );
        };
    }


    // -----------------------------------------------------
    // 5. Announcement Search
    // -----------------------------------------------------

    const announcementSearch =
        document.getElementById("announcement-search");


    announcementSearch.oninput = function () {

        const searchText =
            announcementSearch.value.toLowerCase().trim();


        const filteredAnnouncements =
            announcementsData.filter(function (announcement) {

                return announcement.title
                    .toLowerCase()
                    .includes(searchText);
            });


        displayAnnouncements(filteredAnnouncements);
    };


    // -----------------------------------------------------
    // 6. Assignment Filter
    // -----------------------------------------------------

    const assignmentFilter =
        document.getElementById("assignment-filter");


    assignmentFilter.onchange = function () {

        filterAssignments(
            assignmentFilter.value
        );
    };


    // -----------------------------------------------------
    // 7. Refresh Button
    // -----------------------------------------------------

    const refreshBtn =
        document.getElementById("refresh-btn");


    refreshBtn.onclick = function () {

        loadAllAPIData();
    };


    // -----------------------------------------------------
    // 8. Initial API Loading
    // -----------------------------------------------------

    loadAllAPIData();
};


// =========================================================
// LOAD ALL API DATA
// =========================================================

async function loadAllAPIData() {

    const refreshStatus =
        document.getElementById("refresh-status");


    refreshStatus.textContent =
        "Loading data from JSONPlaceholder...";


    await Promise.all([
        loadStudentProfile(),
        loadAnnouncements(),
        loadAssignments()
    ]);


    refreshStatus.textContent =
        "API data loaded successfully.";
}


// =========================================================
// STUDENT PROFILE
// GET /users/1
// =========================================================

async function loadStudentProfile() {

    const profileContainer =
        document.getElementById("profile-content");


    profileContainer.innerHTML =
        '<p class="loading">Loading student profile...</p>';


    try {

        const response =
            await fetch(API.profile);


        // Check HTTP status
        if (!response.ok) {

            throw new Error(
                "Student profile API request failed."
            );
        }


        // Convert response to JSON
        const data =
            await response.json();


        // Display data dynamically
        profileContainer.innerHTML = `

            <h3>${escapeHTML(data.name)}</h3>

            <p class="profile-info">
                <strong>Username:</strong>
                ${escapeHTML(data.username)}
            </p>

            <p class="profile-info">
                <strong>Email:</strong>
                ${escapeHTML(data.email)}
            </p>

            <p class="profile-info">
                <strong>Phone:</strong>
                ${escapeHTML(data.phone)}
            </p>

        `;

    } catch (error) {

        console.error(error);

        profileContainer.innerHTML = `
            <div class="error-message">
                Unable to load data. Please try again.
            </div>
        `;
    }
}


// =========================================================
// ANNOUNCEMENTS
// GET /posts?_limit=5
// =========================================================

async function loadAnnouncements() {

    const container =
        document.getElementById(
            "announcements-container"
        );


    container.innerHTML =
        '<p class="loading">Loading announcements...</p>';


    try {

        const response =
            await fetch(API.announcements);


        // Check HTTP status
        if (!response.ok) {

            throw new Error(
                "Announcements API request failed."
            );
        }


        // Convert response to JSON
        const data =
            await response.json();


        // Store data for search
        announcementsData = data;


        // Display data dynamically
        displayAnnouncements(data);

    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <div class="error-message">
                Unable to load data. Please try again.
            </div>
        `;
    }
}


// =========================================================
// DISPLAY ANNOUNCEMENTS
// =========================================================

function displayAnnouncements(data) {

    const container =
        document.getElementById(
            "announcements-container"
        );


    if (data.length === 0) {

        container.innerHTML =
            "<p>No announcements found.</p>";

        return;
    }


    container.innerHTML = "";


    data.forEach(function (announcement, index) {

        const announcementElement =
            document.createElement("div");


        announcementElement.className =
            "announcement";


        announcementElement.innerHTML = `

            <p class="announcement-title">
                ${index + 1}. ${escapeHTML(announcement.title)}
            </p>

            <p class="announcement-desc">
                ${escapeHTML(announcement.body)}
            </p>

        `;


        container.appendChild(
            announcementElement
        );


        // Expand / collapse announcement
        const title =
            announcementElement.querySelector(
                ".announcement-title"
            );


        const description =
            announcementElement.querySelector(
                ".announcement-desc"
            );


        title.onclick = function () {

            description.classList.toggle("show");

        };

    });
}


// =========================================================
// ASSIGNMENTS
// GET /todos?userId=1&_limit=5
// =========================================================

async function loadAssignments() {

    const container =
        document.getElementById(
            "assignments-container"
        );


    container.innerHTML =
        '<p class="loading">Loading assignments...</p>';


    try {

        const response =
            await fetch(API.assignments);


        // Check HTTP status
        if (!response.ok) {

            throw new Error(
                "Assignments API request failed."
            );
        }


        // Convert response to JSON
        const data =
            await response.json();


        // Store data for filtering
        assignmentsData = data;


        // Display assignments
        displayAssignments(data);


        // Update summary
        const completedCount =
            data.filter(function (item) {
                return item.completed;
            }).length;


        document.getElementById(
            "assignment-summary"
        ).textContent =
            completedCount + "/" + data.length;

    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <div class="error-message">
                Unable to load data. Please try again.
            </div>
        `;


        document.getElementById(
            "assignment-summary"
        ).textContent = "N/A";
    }
}


// =========================================================
// DISPLAY ASSIGNMENTS
// =========================================================

function displayAssignments(data) {

    const container =
        document.getElementById(
            "assignments-container"
        );


    if (data.length === 0) {

        container.innerHTML =
            "<p>No assignments found.</p>";

        return;
    }


    container.innerHTML =
        '<div class="assignment-list"></div>';


    const assignmentList =
        container.querySelector(
            ".assignment-list"
        );


    data.forEach(function (assignment) {

        const assignmentElement =
            document.createElement("div");


        assignmentElement.className =
            "assignment-item";


        const statusText =
            assignment.completed
                ? "Completed"
                : "Pending";


        const statusClass =
            assignment.completed
                ? "completed"
                : "pending";


        assignmentElement.innerHTML = `

            <h3>
                ${escapeHTML(assignment.title)}
            </h3>

            <span class="assignment-status ${statusClass}">
                ${statusText}
            </span>

        `;


        assignmentList.appendChild(
            assignmentElement
        );

    });
}


// =========================================================
// FILTER ASSIGNMENTS
// Interaction required by Lab 2
// =========================================================

function filterAssignments(filter) {

    let filteredData;


    if (filter === "completed") {

        filteredData =
            assignmentsData.filter(function (assignment) {

                return assignment.completed === true;

            });

    } else if (filter === "pending") {

        filteredData =
            assignmentsData.filter(function (assignment) {

                return assignment.completed === false;

            });

    } else {

        filteredData =
            assignmentsData;
    }


    displayAssignments(filteredData);
}


// =========================================================
// BASIC HTML ESCAPING
// Prevents API text from being interpreted as HTML.
// =========================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");


    div.textContent =
        value;


    return div.innerHTML;
}