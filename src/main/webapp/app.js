const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

let state = {
  donors: [],
  requests: []
};

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
    
    // Initial load
    fetchData();

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
            }
        });
    });

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
                main: "City: "+donor.city+" | Age: "+donor.age+" | Donations: "+donor.donationsCompleted,
                sub: "Phone: "+donor.phone+" | Available: "+(donor.available ? "Yes" : "No")
            }),
            "No donor matches found for this search."
        );
    });

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
            }
        });
    });

    runPriorityBtn.on("click", function() {
        const selectedId = Number(requestSelector.val());
        const request = state.requests.find(item => item.requestId === selectedId);

        if (!request) {
            renderCards(priorityResults, [], null, "Create an emergency request first.");
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
                badge: "Score "+entry.score,
                main: entry.donor.bloodGroup+" donor in "+entry.donor.city+" | Donations: "+entry.donor.donationsCompleted,
                sub: entry.reason
            }),
            "No eligible donors found for the selected request."
        );
    });
});

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

function renderAll() {
    donorCount.text(state.donors.length);
    requestCount.text(state.requests.length);

    renderCards(
        donorList,
        state.donors,
        donor => ({
            title: donor.name,
            badge: donor.bloodGroup,
            main: "City: "+donor.city+" | Age: "+donor.age+" | Donations: "+donor.donationsCompleted,
            sub: "Phone: "+donor.phone+" | Available: "+(donor.available ? "Yes" : "No")
        }),
        "No donors registered yet."
    );

    renderCards(
        requestList,
        state.requests,
        request => ({
            title: request.patientName,
            badge: request.critical ? "Critical" : "Stable",
            main: request.bloodGroupNeeded+" needed at "+request.hospital+", "+request.city,
            sub: "Units: "+request.unitsRequired+" | Contact: "+request.contactNumber+" | "+request.createdAt
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
        requestSelector.append($("<option>", {
            value: request.requestId,
            text: request.requestId+" - "+request.patientName+" ("+request.bloodGroupNeeded+", "+request.city+")"
        }));
    });
}

function renderCards(container, items, formatter, emptyText) {
    container.empty();

    if (!items.length) {
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
        $(clone).find(".badge").text(data.badge);
        $(clone).find(".card-main").text(data.main);
        $(clone).find(".card-sub").text(data.sub);
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
