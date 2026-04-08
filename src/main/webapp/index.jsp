<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blood Donor Finder System</title>
  <link rel="icon" href="data:;base64,iVBORw0KGgo=">
  <link rel="stylesheet" href="styles.css">
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>
<body>
  <div class="page-shell">
    <header class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Blood Donor Finder System</p>
        <h1>Find blood faster when every minute matters.</h1>
        <p class="hero-text">
          A robust, secure, and enterprise-grade platform engineered to facilitate rapid blood donor registration and streamline emergency blood request management. Instantly connect critical patients with available donors using an intelligent, real-time priority-matching algorithm.
        </p>
        <div class="hero-actions">
          <a class="button primary" href="#donor-form">Register Donor</a>
          <a class="button secondary" href="#priority-panel">Run Priority Match</a>
        </div>
        <p class="tagline">This system can help save lives during emergencies.</p>
      </div>
      <aside class="hero-card">
        <div class="metric">
          <span class="metric-label">Active donors</span>
          <strong id="donorCount">0</strong>
        </div>
        <div class="metric">
          <span class="metric-label">Emergency requests</span>
          <strong id="requestCount">0</strong>
        </div>
        <div class="metric">
          <span class="metric-label">System Status</span>
          <strong>Operational</strong>
        </div>
      </aside>
    </header>

    <main class="dashboard">
      <section class="panel" id="donor-form">
        <div class="panel-head">
          <h2>Register Donor</h2>
          <p>Add donors to the database for quick emergency access.</p>
        </div>
        <form id="registerForm" class="grid-form">
          <label>
            <span>Name</span>
            <input type="text" id="name" required>
          </label>
          <label>
            <span>Age</span>
            <input type="number" id="age" min="18" max="65" required>
          </label>
          <label>
            <span>Blood Group</span>
            <select id="bloodGroup" required></select>
          </label>
          <label>
            <span>City</span>
            <input type="text" id="city" required>
          </label>
          <label>
            <span>Phone</span>
            <input type="tel" id="phone" required>
          </label>
          <label>
            <span>Donations Completed</span>
            <input type="number" id="donationsCompleted" min="0" required>
          </label>
          <label class="checkbox-row">
            <input type="checkbox" id="available" checked>
            <span>Available right now</span>
          </label>
          <button class="button primary submit-button" type="submit">Save Donor</button>
        </form>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2>Search Donors</h2>
          <p>Search by blood group and location to find immediate matches.</p>
        </div>
        <form id="searchForm" class="grid-form compact">
          <label>
            <span>Blood Group</span>
            <select id="searchBloodGroup" required></select>
          </label>
          <label>
            <span>City</span>
            <input type="text" id="searchCity" placeholder="Ahmedabad" required>
          </label>
          <button class="button primary submit-button" type="submit">Search</button>
        </form>
        <div id="searchResults" class="cards-grid"></div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2>Emergency Request</h2>
          <p>Capture urgent blood requests and make matching faster.</p>
        </div>
        <form id="requestForm" class="grid-form">
          <label>
            <span>Patient Name</span>
            <input type="text" id="patientName" required>
          </label>
          <label>
            <span>Blood Needed</span>
            <select id="requestBloodGroup" required></select>
          </label>
          <label>
            <span>Hospital</span>
            <input type="text" id="hospital" required>
          </label>
          <label>
            <span>City</span>
            <input type="text" id="requestCity" required>
          </label>
          <label>
            <span>Units Required</span>
            <input type="number" id="unitsRequired" min="1" required>
          </label>
          <label>
            <span>Contact Number</span>
            <input type="tel" id="contactNumber" required>
          </label>
          <label class="checkbox-row">
            <input type="checkbox" id="critical" checked>
            <span>Critical emergency</span>
          </label>
          <button class="button primary submit-button" type="submit">Create Request</button>
        </form>
      </section>

      <section class="panel wide-panel" id="priority-panel">
        <div class="panel-head">
          <h2>Priority Matching</h2>
          <p>
            Initiate our intelligent priority matching engine to automatically rank and suggest the most suitable donors based on location proximity, previous donation history, and critical patient flags.
          </p>
        </div>
        <div class="priority-controls">
          <label>
            <span>Select Request</span>
            <select id="requestSelector"></select>
          </label>
          <button class="button secondary" id="runPriorityBtn" type="button">Generate Priority List</button>
        </div>
        <div id="priorityResults" class="cards-grid"></div>
      </section>

      <section class="panel wide-panel">
        <div class="panel-head">
          <h2>System Data</h2>
          <p>Live, real-time synchronization of donor registries and critical emergency alerts.</p>
        </div>
        <div class="tables">
          <div>
            <h3>Donor Database</h3>
            <div id="donorList" class="cards-grid"></div>
          </div>
          <div>
            <h3>Emergency Alerts</h3>
            <div id="requestList" class="cards-grid"></div>
          </div>
        </div>
      </section>
    </main>
  </div>

  <template id="cardTemplate">
    <article class="info-card">
      <div class="card-top">
        <h3></h3>
        <span class="badge"></span>
      </div>
      <p class="card-main"></p>
      <p class="card-sub"></p>
    </article>
  </template>

  <script src="app.js"></script>
</body>
</html>
