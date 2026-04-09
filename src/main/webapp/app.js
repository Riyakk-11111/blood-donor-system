const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Blood Compatibility Matrix Data
// Each key is a recipient, value array lists compatible donors
const compatibilityMap = {
    "A+":  ["A+", "A-", "O+", "O-"],
    "A-":  ["A-", "O-"],
    "B+":  ["B+", "B-", "O+", "O-"],
    "B-":  ["B-", "O-"],
    "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    "AB-": ["A-", "B-", "AB-", "O-"],
    "O+":  ["O+", "O-"],
    "O-":  ["O-"]
};

let state = {
    donors: [],
    requests: []
};

// Emergency timer state
let emergencyTimerInterval = null;
let emergencyTimerSeconds = 0;

// Audio context for alert sounds
let audioCtx = null;

const donorCount = $("#donorCount");
const requestCount = $("#requestCount");
const donorList = $("#donorList");
const requestList = $("#requestList");
const searchResults = $("#searchResults");
const priorityResults = $("#priorityResults");
const requestSelector = $("#requestSelector");
const registerForm = $("#registerForm");
const searchForm = $("#searchForm");
const requestForm = $("#requestForm");
const runPriorityBtn = $("#runPriorityBtn");
const cardTemplate = $("#cardTemplate")[0];

$(document).ready(function() {
    populateSelect($("#bloodGroup"));
    populateSelect($("#searchBloodGroup"));
    populateSelect($("#requestBloodGroup"));
    
    // Build the compatibility matrix table
    buildCompatibilityMatrix();
    
    // Start live clock
    startLiveClock();
    
    // Start heartbeat animation
    startHeartbeat();
    
    // Start emergency response timer
    startEmergencyTimer();

    // Initial load
    fetchData();

    // ──────────────── DONOR REGISTRATION ────────────────
    registerForm.on("submit", function(event) {
        event.preventDefault();
        const donor = {
            name: $("#name").val().trim(),
            age: Number($("#age").val()),
            bloodGroup: $("#bloodGroup").val(),
            city: $("#city").val().trim(),
            phone: $("#phone").val().trim(),
            available: $("#available").is(":checked"),
            donationsCompleted: Number($("#donationsCompleted").val())
        };

        $.ajax({
            url: "api/donors",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(donor),
            success: function(savedDonor) {
                state.donors.push(savedDonor);
                registerForm[0].reset();
                $("#available").prop("checked", true);
                renderAll();
                showToast("success", "Donor Registered", savedDonor.name + " has been added to the donor database.");
                playSuccessSound();
            },
            error: function() {
                showToast("error", "Registration Failed", "Could not save donor. Please try again.");
            }
        });
    });

    // ──────────────── SEARCH DONORS ────────────────
    searchForm.on("submit", function(event) {
        event.preventDefault();
        const bloodGroup = $("#searchBloodGroup").val();
        const city = $("#searchCity").val().trim().toLowerCase();
        
        const matches = state.donors
            .filter(donor => donor.available)
            .filter(donor => donor.bloodGroup === bloodGroup)
            .filter(donor => donor.city.toLowerCase().includes(city))
            .sort((left, right) => right.donationsCompleted - left.donationsCompleted);

        renderCards(
            searchResults,
            matches,
            donor => ({
                title: donor.name,
                badge: donor.bloodGroup,
                badgeClass: "",
                main: "City: "+donor.city+" | Age: "+donor.age+" | Donations: "+donor.donationsCompleted,
                sub: "Phone: "+donor.phone+" | Available: "+(donor.available ? "Yes" : "No"),
                cardClass: ""
            }),
            "No donor matches found for this search."
        );

        if (matches.length > 0) {
            showToast("info", "Search Complete", matches.length + " donor(s) found for " + bloodGroup + " in " + city + ".");
        } else {
            showToast("warning", "No Results", "No available donors found for " + bloodGroup + " in " + city + ".");
        }
    });

    // ──────────────── EMERGENCY REQUEST (with redirect + alert) ────────────────
    requestForm.on("submit", function(event) {
        event.preventDefault();
        const request = {
            patientName: $("#patientName").val().trim(),
            bloodGroupNeeded: $("#requestBloodGroup").val(),
            hospital: $("#hospital").val().trim(),
            city: $("#requestCity").val().trim(),
            unitsRequired: Number($("#unitsRequired").val()),
            critical: $("#critical").is(":checked"),
            contactNumber: $("#contactNumber").val().trim()
        };

        $.ajax({
            url: "api/requests",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(request),
            success: function(savedRequest) {
                state.requests.unshift(savedRequest);
                requestForm[0].reset();
                $("#critical").prop("checked", true);
                renderAll();

                // Reset the emergency response timer
                emergencyTimerSeconds = 0;

                if (savedRequest.critical) {
                    // Play emergency alert sound
                    playEmergencyAlertSound();

                    // Show fullscreen emergency banner
                    showEmergencyBanner(savedRequest);

                    showToast("emergency", "CRITICAL ALERT", 
                        savedRequest.patientName + " needs " + savedRequest.bloodGroupNeeded + " urgently at " + savedRequest.hospital + "!");
                } else {
                    playSuccessSound();
                    showToast("success", "Request Created", 
                        "Blood request for " + savedRequest.patientName + " has been logged.");

                    // Redirect to priority panel for non-critical as well
                    redirectToPriorityMatch(savedRequest);
                }
            },
            error: function() {
                showToast("error", "Request Failed", "Could not create emergency request. Please try again.");
            }
        });
    });

    // ──────────────── PRIORITY MATCHING ────────────────
    runPriorityBtn.on("click", function() {
        const selectedId = Number(requestSelector.val());
        const request = state.requests.find(item => item.requestId === selectedId);

        if (!request) {
            renderCards(priorityResults, [], null, "Create an emergency request first.");
            showToast("warning", "No Request Selected", "Please create an emergency request first.");
            return;
        }

        const ranked = state.donors
            .filter(donor => donor.available)
            .filter(donor => donor.bloodGroup === request.bloodGroupNeeded)
            .map(donor => ({
                donor,
                score: computePriorityScore(donor, request),
                reason: buildPriorityReason(donor, request)
            }))
            .sort((left, right) => right.score - left.score);

        renderCards(
            priorityResults,
            ranked,
            entry => ({
                title: entry.donor.name,
                badge: "Score " + entry.score,
                badgeClass: "badge-score",
                main: entry.donor.bloodGroup+" donor in "+entry.donor.city+" | Donations: "+entry.donor.donationsCompleted,
                sub: entry.reason,
                cardClass: ""
            }),
            "No eligible donors found for the selected request."
        );

        if (ranked.length > 0) {
            showToast("success", "Priority Match Complete", ranked.length + " donor(s) ranked for " + request.patientName + ".");
            playSuccessSound();
        } else {
            showToast("warning", "No Matches", "No eligible donors found for " + request.bloodGroupNeeded + " in the system.");
        }
    });

    // ──────────────── EMERGENCY BANNER BUTTONS ────────────────
    $("#emergencyGoToMatch").on("click", function() {
        hideEmergencyBanner();
        // Auto-select the latest request and redirect
        const latestRequest = state.requests[0];
        if (latestRequest) {
            redirectToPriorityMatch(latestRequest);
        }
    });

    $("#emergencyDismiss").on("click", function() {
        hideEmergencyBanner();
    });
});

// ════════════════════════════════════════════════════
//  DATA FETCHING
// ════════════════════════════════════════════════════

function fetchData() {
    $.when(
        $.get("api/donors"),
        $.get("api/requests")
    ).done(function(donorsResponse, requestsResponse) {
        state.donors = donorsResponse[0];
        state.requests = requestsResponse[0];
        renderAll();
    });
}

// ════════════════════════════════════════════════════
//  RENDERING
// ════════════════════════════════════════════════════

function renderAll() {
    donorCount.text(state.donors.length);
    requestCount.text(state.requests.length);

    renderCards(
        donorList,
        state.donors,
        donor => ({
            title: donor.name,
            badge: donor.bloodGroup,
            badgeClass: "",
            main: "City: "+donor.city+" | Age: "+donor.age+" | Donations: "+donor.donationsCompleted,
            sub: "Phone: "+donor.phone+" | Available: "+(donor.available ? "Yes" : "No"),
            cardClass: ""
        }),
        "No donors registered yet."
    );

    renderCards(
        requestList,
        state.requests,
        request => ({
            title: request.patientName,
            badge: request.critical ? "⚠ Critical" : "Stable",
            badgeClass: request.critical ? "badge-critical" : "",
            main: request.bloodGroupNeeded+" needed at "+request.hospital+", "+request.city,
            sub: "Units: "+request.unitsRequired+" | Contact: "+request.contactNumber+" | "+request.createdAt,
            cardClass: request.critical ? "critical-card" : ""
        }),
        "No emergency alerts created yet."
    );

    updateRequestSelector();
    renderCards(searchResults, [], null, "Search results will appear here.");
    renderCards(priorityResults, [], null, "Select a request and generate a priority list.");
}

function updateRequestSelector() {
    requestSelector.empty();
    if (state.requests.length === 0) {
        requestSelector.append($("<option>", {
            value: "",
            text: "No requests available"
        }));
        return;
    }

    state.requests.forEach(request => {
        const prefix = request.critical ? "🔴 " : "🟢 ";
        requestSelector.append($("<option>", {
            value: request.requestId,
            text: prefix + request.requestId+" - "+request.patientName+" ("+request.bloodGroupNeeded+", "+request.city+")"
        }));
    });
}

function renderCards(container, items, formatter, emptyText) {
    container.empty();

    if (!items || !items.length) {
        container.append($("<div>", {
            class: "empty-state",
            text: emptyText
        }));
        return;
    }

    items.forEach(item => {
        const data = formatter(item);
        const clone = cardTemplate.content.cloneNode(true);
        $(clone).find("h3").text(data.title);
        const badgeEl = $(clone).find(".badge");
        badgeEl.text(data.badge);
        if (data.badgeClass) badgeEl.addClass(data.badgeClass);
        $(clone).find(".card-main").text(data.main);
        $(clone).find(".card-sub").text(data.sub);
        if (data.cardClass) $(clone).find(".info-card").addClass(data.cardClass);
        container.append(clone);
    });
}

function populateSelect(selectElement) {
    bloodGroups.forEach(group => {
        selectElement.append($("<option>", {
            value: group,
            text: group
        }));
    });
}

// ════════════════════════════════════════════════════
//  PRIORITY SCORING ALGORITHM
// ════════════════════════════════════════════════════

function computePriorityScore(donor, request) {
    let score = 50;
    if (donor.city.toLowerCase() === request.city.toLowerCase()) {
        score += 25;
    }
    if (request.critical) {
        score += 20;
    }
    score += Math.min(donor.donationsCompleted * 3, 15);
    if (donor.age >= 18 && donor.age <= 30) {
        score += 10;
    }
    return score;
}

function buildPriorityReason(donor, request) {
    const notes = [];
    if (donor.city.toLowerCase() === request.city.toLowerCase()) {
        notes.push("same city match");
    } else {
        notes.push("nearby city support");
    }
    if (request.critical) {
        notes.push("critical case boosted");
    }
    if (donor.donationsCompleted > 0) {
        notes.push("experienced donor with "+donor.donationsCompleted+" previous donations");
    }
    return "Priority logic: "+notes.join(", ")+".";
}

// ════════════════════════════════════════════════════
//  EMERGENCY REDIRECT TO PRIORITY MATCHING
// ════════════════════════════════════════════════════

function redirectToPriorityMatch(request) {
    // Set the request selector to the new request
    requestSelector.val(request.requestId);

    // Smooth scroll to the priority panel
    $("html, body").animate({
        scrollTop: $("#priority-panel").offset().top - 20
    }, 800, function() {
        // Highlight the priority panel briefly
        $("#priority-panel").addClass("panel-highlight");
        setTimeout(function() {
            $("#priority-panel").removeClass("panel-highlight");
        }, 2000);

        // Auto-click the generate priority list button
        runPriorityBtn.trigger("click");
    });
}

// ════════════════════════════════════════════════════
//  EMERGENCY BANNER
// ════════════════════════════════════════════════════

function showEmergencyBanner(request) {
    const detailsHtml = 
        "<strong>Patient:</strong> " + request.patientName + "<br>" +
        "<strong>Blood Group:</strong> " + request.bloodGroupNeeded + "<br>" +
        "<strong>Hospital:</strong> " + request.hospital + ", " + request.city + "<br>" +
        "<strong>Units Required:</strong> " + request.unitsRequired + "<br>" +
        "<strong>Contact:</strong> " + request.contactNumber;

    $("#emergencyBannerText").text("A critical blood request has been created and needs immediate attention.");
    $("#emergencyBannerDetails").html(detailsHtml);
    $("#emergencyBanner").removeClass("hidden");

    // Prevent body scroll
    $("body").css("overflow", "hidden");
}

function hideEmergencyBanner() {
    $("#emergencyBanner").addClass("hidden");
    $("body").css("overflow", "");
}

// ════════════════════════════════════════════════════
//  TOAST NOTIFICATIONS
// ════════════════════════════════════════════════════

function showToast(type, title, message) {
    const iconMap = {
        success: "fa-solid fa-circle-check",
        error: "fa-solid fa-circle-xmark",
        warning: "fa-solid fa-triangle-exclamation",
        info: "fa-solid fa-circle-info",
        emergency: "fa-solid fa-bell"
    };

    const toast = $("<div>", { class: "toast toast-" + type });
    toast.html(
        '<i class="toast-icon ' + iconMap[type] + '"></i>' +
        '<div class="toast-body">' +
            '<div class="toast-title">' + title + '</div>' +
            '<div class="toast-message">' + message + '</div>' +
        '</div>'
    );

    $("#toastContainer").append(toast);

    // Auto-dismiss after 5 seconds
    setTimeout(function() {
        toast.addClass("toast-exit");
        setTimeout(function() {
            toast.remove();
        }, 300);
    }, 5000);
}

// ════════════════════════════════════════════════════
//  ALERT SOUNDS (Web Audio API)
// ════════════════════════════════════════════════════

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

function playEmergencyAlertSound() {
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        // Three-tone emergency alarm: high → low → high
        const frequencies = [880, 660, 880, 660, 880];
        const durations = [0.15, 0.15, 0.15, 0.15, 0.2];

        let offset = 0;
        frequencies.forEach(function(freq, i) {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = "square";
            oscillator.frequency.setValueAtTime(freq, now + offset);
            gainNode.gain.setValueAtTime(0.15, now + offset);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + offset + durations[i]);

            oscillator.start(now + offset);
            oscillator.stop(now + offset + durations[i]);
            offset += durations[i] + 0.05;
        });

        // Second pass: longer siren sweep
        setTimeout(function() {
            const ctx2 = getAudioContext();
            const now2 = ctx2.currentTime;
            const osc = ctx2.createOscillator();
            const gain = ctx2.createGain();
            osc.connect(gain);
            gain.connect(ctx2.destination);

            osc.type = "sine";
            osc.frequency.setValueAtTime(600, now2);
            osc.frequency.linearRampToValueAtTime(1200, now2 + 0.3);
            osc.frequency.linearRampToValueAtTime(600, now2 + 0.6);
            gain.gain.setValueAtTime(0.12, now2);
            gain.gain.exponentialRampToValueAtTime(0.01, now2 + 0.6);

            osc.start(now2);
            osc.stop(now2 + 0.6);
        }, 1200);
    } catch (e) {
        // Graceful fallback: Web Audio API not supported
        console.warn("Audio playback not supported:", e);
    }
}

function playSuccessSound() {
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        // Pleasant two-note chime
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(523.25, now); // C5
        gain1.gain.setValueAtTime(0.1, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc1.start(now);
        osc1.stop(now + 0.2);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(659.25, now + 0.15); // E5
        gain2.gain.setValueAtTime(0.1, now + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.4);
    } catch (e) {
        console.warn("Audio playback not supported:", e);
    }
}

// ════════════════════════════════════════════════════
//  LIVE CLOCK
// ════════════════════════════════════════════════════

function startLiveClock() {
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        $("#liveClock").text(hours + ":" + minutes + ":" + seconds);
    }
    updateClock();
    setInterval(updateClock, 1000);
}

// ════════════════════════════════════════════════════
//  HEARTBEAT SVG ANIMATION
// ════════════════════════════════════════════════════

function startHeartbeat() {
    const container = $("#heartbeatLine");
    if (!container.length) return;

    // Create an SVG heartbeat line
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 600 40");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.style.width = "100%";
    svg.style.height = "100%";

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#E11D48");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");

    // Heartbeat waveform path
    const heartbeatPath = "M0,20 L60,20 L80,20 L90,5 L100,35 L110,10 L120,25 L130,20 L200,20 L220,20 L230,5 L240,35 L250,10 L260,25 L270,20 L340,20 L360,20 L370,5 L380,35 L390,10 L400,25 L410,20 L480,20 L500,20 L510,5 L520,35 L530,10 L540,25 L550,20 L600,20";
    path.setAttribute("d", heartbeatPath);

    // Animate with dash offset for tracing effect
    path.style.strokeDasharray = "600";
    path.style.strokeDashoffset = "600";
    path.style.animation = "heartbeatTrace 2.5s linear infinite";

    svg.appendChild(path);
    container[0].appendChild(svg);

    // Inject the animation keyframes
    if (!document.getElementById("heartbeat-style")) {
        const style = document.createElement("style");
        style.id = "heartbeat-style";
        style.textContent = "@keyframes heartbeatTrace { 0% { stroke-dashoffset: 600; } 100% { stroke-dashoffset: 0; } }";
        document.head.appendChild(style);
    }
}

// ════════════════════════════════════════════════════
//  EMERGENCY RESPONSE TIMER
// ════════════════════════════════════════════════════

function startEmergencyTimer() {
    emergencyTimerSeconds = 0;
    if (emergencyTimerInterval) clearInterval(emergencyTimerInterval);

    emergencyTimerInterval = setInterval(function() {
        emergencyTimerSeconds++;
        const minutes = String(Math.floor(emergencyTimerSeconds / 60)).padStart(2, "0");
        const seconds = String(emergencyTimerSeconds % 60).padStart(2, "0");
        $("#emergencyTimerText").text("Response Window: " + minutes + ":" + seconds);

        // Change color based on time elapsed
        const bar = $("#emergencyTimerBar");
        if (emergencyTimerSeconds > 300) {
            bar.css("border-color", "rgba(239, 68, 68, 0.5)");
            bar.find(".timer-display").css("color", "#fca5a5");
        } else if (emergencyTimerSeconds > 120) {
            bar.css("border-color", "rgba(245, 158, 11, 0.4)");
            bar.find(".timer-display").css("color", "#fcd34d");
        }
    }, 1000);
}

// ════════════════════════════════════════════════════
//  BLOOD COMPATIBILITY MATRIX
// ════════════════════════════════════════════════════

function buildCompatibilityMatrix() {
    const table = $("#compatTable");
    const thead = table.find("thead tr");
    const tbody = table.find("tbody");

    // Build header
    bloodGroups.forEach(function(group) {
        thead.append($("<th>").text(group));
    });

    // Build rows
    bloodGroups.forEach(function(recipient) {
        const row = $("<tr>");
        row.append($("<th>").text(recipient));

        bloodGroups.forEach(function(donor) {
            const isCompat = compatibilityMap[recipient].includes(donor);
            const cell = $("<td>", {
                text: isCompat ? "✓" : "✗",
                class: isCompat ? "compat-yes" : "compat-no"
            });

            // Click handler for cell details
            cell.on("click", function() {
                const infoText = isCompat
                    ? donor + " can donate to " + recipient + ". This is a compatible transfusion."
                    : donor + " cannot donate to " + recipient + ". This transfusion is NOT compatible.";
                $("#compatInfoText").text(infoText);
                $("#compatInfo").removeClass("hidden");
            });

            row.append(cell);
        });

        tbody.append(row);
    });
}

// ════════════════════════════════════════════════════
//  PANEL HIGHLIGHT ANIMATION (injected dynamically)
// ════════════════════════════════════════════════════

(function() {
    if (!document.getElementById("dynamic-styles")) {
        const style = document.createElement("style");
        style.id = "dynamic-styles";
        style.textContent = 
            ".panel-highlight { " +
            "  border-color: rgba(225, 29, 72, 0.5) !important; " +
            "  box-shadow: 0 0 30px rgba(225, 29, 72, 0.2) !important; " +
            "  transition: border-color 0.5s ease, box-shadow 0.5s ease !important; " +
            "}";
        document.head.appendChild(style);
    }
})();
