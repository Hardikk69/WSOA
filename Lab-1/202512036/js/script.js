// Wait for page to finish loading
window.onload = function () {

    // 1. Dark Mode / Theme Toggle
    var themeBtn = document.getElementById("theme-btn");
    themeBtn.onclick = function () {
        var body = document.body;
        if (body.className === "dark-theme") {
            body.className = "";
            themeBtn.textContent = "Switch to Dark Mode";
        } else {
            body.className = "dark-theme";
            themeBtn.textContent = "Switch to Light Mode";
        }
    };

    // 2. Greeting and Clock
    function updateClock() {
        var today = new Date();

        // Show current time
        var clockElement = document.getElementById("live-time");
        clockElement.textContent = today.toLocaleTimeString();

        // Calculate greeting
        var hours = today.getHours();
        var greetingText = document.getElementById("greeting-text");

        if (hours < 12) {
            greetingText.textContent = "Good Morning, Hardik Kansara!";
        } else if (hours < 18) {
            greetingText.textContent = "Good Afternoon, Hardik Kansara!";
        } else {
            greetingText.textContent = "Good Evening, Hardik Kansara!";
        }
    }

    // Call clock function immediately and repeat every second
    updateClock();
    setInterval(updateClock, 1000);

    // 3. Search and Filter Services
    var searchBox = document.getElementById("service-search");
    searchBox.onkeyup = function () {
        var filter = searchBox.value.toLowerCase();
        var services = document.getElementsByClassName("service-item");

        for (var i = 0; i < services.length; i++) {
            var item = services[i];
            var serviceName = item.textContent.toLowerCase();

            if (serviceName.indexOf(filter) > -1) {
                item.style.display = "block";
            } else {
                item.style.display = "none";
            }
        }
    };

    // 4. Expand/Collapse Announcements
    var titles = document.getElementsByClassName("announcement-title");
    for (var i = 0; i < titles.length; i++) {
        titles[i].onclick = function () {
            var desc = this.nextElementSibling;
            if (desc.style.display === "block") {
                desc.style.display = "none";
            } else {
                desc.style.display = "block";
            }
        };
    }

    // 5. Click Alert on Services
    var services = document.getElementsByClassName("service-item");
    for (var i = 0; i < services.length; i++) {
        services[i].onclick = function () {
            alert("Clicked: " + this.textContent);
        };
    }
};
