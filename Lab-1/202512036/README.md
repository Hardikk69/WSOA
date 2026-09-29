# CampusConnect – Smart Campus Service Portal

CampusConnect is a responsive student dashboard prototype created for the Web Services & SOA Laboratory. It is built using HTML, CSS, and basic JavaScript.

## Project Structure
```text
CampusConnect/
├── index.html
├── css/
│   └── style.css
└── js/
    └── script.js
```

## Implemented Features
1. **Theme Switcher**: Toggles between light and dark modes when the navbar button is clicked.
2. **Dynamic Greeting & Live Clock**: Greets the student ("Good Morning/Afternoon/Evening") depending on the time of day and shows a ticking live clock.
3. **Filter Quick Services**: Real-time filtering of the campus services list as you type.
4. **Expandable Announcements**: Expand or collapse announcement details by clicking on their titles.

---

## Future Service Mapping

This table maps the UI components/actions to future backend web service APIs:

| UI Component / Action | HTTP Method | API End Point | Example Output / Action |
| :--- | :--- | :--- | :--- |
| **Welcome Section** | `GET` | `/api/student` | Shows student name, ID, and department |
| **Attendance Summary** | `GET` | `/api/attendance` | Displays overall attendance percentage |
| **Enrolled Courses** | `GET` | `/api/courses` | Lists total active courses |
| **Today's Timetable** | `GET` | `/api/timetable/today` | Populates the daily lectures table |
| **Announcements** | `GET` | `/api/announcements` | Fetches recent campus announcements |
| **Course Registration** | `POST` | `/api/registration` | Submits new course choices to backend |
| **Fee Payment** | `POST` | `/api/payment` | Processes a term fee transaction |
| **Transcript Request** | `POST` | `/api/transcript` | Submits a request for student transcript |
| **Library Search** | `GET` | `/api/library?query=...` | Searches catalog for relevant book results |

---

## How to Run
1. Open the `CampusConnect` folder.
2. Double-click `index.html` to open it in any web browser.
3. Use the theme toggle, filter services using the search input, or click announcements to expand them.
