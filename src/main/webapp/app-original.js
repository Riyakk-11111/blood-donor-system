const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const storageKeys = {
  donors: "blood-donor-donors",
  requests: "blood-donor-requests"
};

const defaultDonors = [
  {
    id: 1001,
    name: "Aarav Mehta",
    age: 22,
    bloodGroup: "O+",
    city: "Ahmedabad",
    phone: "9876543210",
    available: true,
    donationsCompleted: 3
  },
  {
    id: 1002,
    name: "Diya Shah",
    age: 21,
    bloodGroup: "A+",
    city: "Surat",
    phone: "9876501234",
    available: true,
    donationsCompleted: 2
  },
  {
    id: 1003,
    name: "Rohan Patel",
    age: 24,
    bloodGroup: "B+",
    city: "Vadodara",
    phone: "9898989898",
    available: true,
    donationsCompleted: 5
  },
  {
    id: 1004,
    name: "Nisha Verma",
    age: 23,
    bloodGroup: "O-",
    city: "Ahmedabad",
    phone: "9811112233",
    available: true,
    donationsCompleted: 4
  },
  {
    id: 1005,
    name: "Priya Nair",
    age: 26,
    bloodGroup: "A+",
    city: "Ahmedabad",
    phone: "9123456780",
    available: true,
    donationsCompleted: 6
  }
];

const state = {
  donors: loadState(storageKeys.donors, defaultDonors),
  requests: loadState(storageKeys.requests, [])
};

const donorCount = document.querySelector("#donorCount");
const requestCount = document.querySelector("#requestCount");
const donorList = document.querySelector("#donorList");
const requestList = document.querySelector("#requestList");
const searchResults = document.querySelector("#searchResults");
const priorityResults = document.querySelector("#priorityResults");
const requestSelector = document.querySelector("#requestSelector");
const registerForm = document.querySelector("#registerForm");
const searchForm = document.querySelector("#searchForm");
const requestForm = document.querySelector("#requestForm");
const runPriorityBtn = document.querySelector("#runPriorityBtn");
const cardTemplate = document.querySelector("#cardTemplate");

populateSelect(document.querySelector("#bloodGroup"));
populateSelect(document.querySelector("#searchBloodGroup"));
populateSelect(document.querySelector("#requestBloodGroup"));

renderAll();

registerForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const donor = {
    id: getNextId(state.donors, 1000),
    name: document.querySelector("#name").value.trim(),
    age: Number(document.querySelector("#age").value),
    bloodGroup: document.querySelector("#bloodGroup").value,
    city: document.querySelector("#city").value.trim(),
    phone: document.querySelector("#phone").value.trim(),
    available: document.querySelector("#available").checked,
    donationsCompleted: Number(document.querySelector("#donationsCompleted").value)
  };

  state.donors.unshift(donor);
  persist(storageKeys.donors, state.donors);
  registerForm.reset();
  document.querySelector("#available").checked = true;
  renderAll();
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const bloodGroup = document.querySelector("#searchBloodGroup").value;
  const city = document.querySelector("#searchCity").value.trim().toLowerCase();
  const matches = state.donors
    .filter((donor) => donor.available)
    .filter((donor) => donor.bloodGroup === bloodGroup)
    .filter((donor) => donor.city.toLowerCase().includes(city))
    .sort((left, right) => right.donationsCompleted - left.donationsCompleted);

  renderCards(
    searchResults,
    matches,
    (donor) => ({
      title: donor.name,
      badge: donor.bloodGroup,
      main: `City: ${donor.city} | Age: ${donor.age} | Donations: ${donor.donationsCompleted}`,
      sub: `Phone: ${donor.phone} | Available: ${donor.available ? "Yes" : "No"}`
    }),
    "No donor matches found for this search."
  );
});

requestForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const request = {
    requestId: getNextId(state.requests, 500),
    patientName: document.querySelector("#patientName").value.trim(),
    bloodGroupNeeded: document.querySelector("#requestBloodGroup").value,
    hospital: document.querySelector("#hospital").value.trim(),
    city: document.querySelector("#requestCity").value.trim(),
    unitsRequired: Number(document.querySelector("#unitsRequired").value),
    critical: document.querySelector("#critical").checked,
    contactNumber: document.querySelector("#contactNumber").value.trim(),
    createdAt: new Date().toLocaleString()
  };

  state.requests.unshift(request);
  persist(storageKeys.requests, state.requests);
  requestForm.reset();
  document.querySelector("#critical").checked = true;
  renderAll();
});

runPriorityBtn.addEventListener("click", () => {
  const selectedId = Number(requestSelector.value);
  const request = state.requests.find((item) => item.requestId === selectedId);

  if (!request) {
    renderCards(priorityResults, [], null, "Create an emergency request first.");
    return;
  }

  const ranked = state.donors
    .filter((donor) => donor.available)
    .filter((donor) => donor.bloodGroup === request.bloodGroupNeeded)
    .map((donor) => ({
      donor,
      score: computePriorityScore(donor, request),
      reason: buildPriorityReason(donor, request)
    }))
    .sort((left, right) => right.score - left.score);

  renderCards(
    priorityResults,
    ranked,
    (entry) => ({
      title: entry.donor.name,
      badge: `Score ${entry.score}`,
      main: `${entry.donor.bloodGroup} donor in ${entry.donor.city} | Donations: ${entry.donor.donationsCompleted}`,
      sub: entry.reason
    }),
    "No eligible donors found for the selected request."
  );
});

function renderAll() {
  donorCount.textContent = state.donors.length;
  requestCount.textContent = state.requests.length;

  renderCards(
    donorList,
    state.donors,
    (donor) => ({
      title: donor.name,
      badge: donor.bloodGroup,
      main: `City: ${donor.city} | Age: ${donor.age} | Donations: ${donor.donationsCompleted}`,
      sub: `Phone: ${donor.phone} | Available: ${donor.available ? "Yes" : "No"}`
    }),
    "No donors registered yet."
  );

  renderCards(
    requestList,
    state.requests,
    (request) => ({
      title: request.patientName,
      badge: request.critical ? "Critical" : "Stable",
      main: `${request.bloodGroupNeeded} needed at ${request.hospital}, ${request.city}`,
      sub: `Units: ${request.unitsRequired} | Contact: ${request.contactNumber} | ${request.createdAt}`
    }),
    "No emergency alerts created yet."
  );

  updateRequestSelector();
  renderCards(
    searchResults,
    [],
    null,
    "Search results will appear here."
  );
  renderCards(
    priorityResults,
    [],
    null,
    "Select a request and generate a priority list."
  );
}

function updateRequestSelector() {
  requestSelector.innerHTML = "";
  if (state.requests.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No requests available";
    requestSelector.append(option);
    return;
  }

  state.requests.forEach((request) => {
    const option = document.createElement("option");
    option.value = request.requestId;
    option.textContent = `${request.requestId} - ${request.patientName} (${request.bloodGroupNeeded}, ${request.city})`;
    requestSelector.append(option);
  });
}

function renderCards(container, items, formatter, emptyText) {
  container.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = emptyText;
    container.append(empty);
    return;
  }

  items.forEach((item) => {
    const data = formatter(item);
    const clone = cardTemplate.content.cloneNode(true);
    clone.querySelector("h3").textContent = data.title;
    clone.querySelector(".badge").textContent = data.badge;
    clone.querySelector(".card-main").textContent = data.main;
    clone.querySelector(".card-sub").textContent = data.sub;
    container.append(clone);
  });
}

function populateSelect(selectElement) {
  bloodGroups.forEach((group) => {
    const option = document.createElement("option");
    option.value = group;
    option.textContent = group;
    selectElement.append(option);
  });
}

function loadState(key, fallback) {
  const saved = localStorage.getItem(key);
  if (!saved) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return structuredClone(fallback);
  }
  return JSON.parse(saved);
}

function persist(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getNextId(items, base) {
  if (!items.length) {
    return base + 1;
  }
  return Math.max(...items.map((item) => item.id || item.requestId)) + 1;
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
    notes.push(`experienced donor with ${donor.donationsCompleted} previous donations`);
  }
  return `Priority logic: ${notes.join(", ")}.`;
}
