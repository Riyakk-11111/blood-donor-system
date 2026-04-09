<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Blood Donor Finder System — Enterprise-grade platform for rapid donor registration, emergency blood request management, and intelligent priority matching.">
  <title>Blood Donor Finder System</title>
  
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>
<body>

  <!-- Emergency Fullscreen Banner (hidden by default) -->
  <div id="emergencyBanner" class="emergency-banner hidden">
    <div class="emergency-banner-content">
      <div class="emergency-pulse-ring"></div>
      <i class="fa-solid fa-triangle-exclamation emergency-banner-icon"></i>
      <h2>CRITICAL EMERGENCY ALERT</h2>
      <p id="emergencyBannerText">A critical blood request has been created.</p>
      <div class="emergency-banner-details" id="emergencyBannerDetails"></div>
      <div class="emergency-banner-actions">
        <button class="button primary" id="emergencyGoToMatch">
          <i class="fa-solid fa-bolt"></i> Find Matching Donors Now
        </button>
        <button class="button secondary" id="emergencyDismiss">
          <i class="fa-solid fa-xmark"></i> Dismiss
        </button>
      </div>
    </div>
  </div>

  <!-- Toast Notification Container -->
  <div id="toastContainer" class="toast-container"></div>

  <div class="page-shell">
    <header class="hero">
      <div class="hero-copy">
        <p class="eyebrow"><i class="fa-solid fa-droplet"></i> Blood Donor Finder System</p>
        <h1>Find blood faster when every minute matters.</h1>
        <p class="hero-text">
          A robust, secure, and enterprise-grade platform engineered to facilitate rapid blood donor registration and streamline emergency blood request management. Instantly connect critical patients with available donors using an intelligent, real-time priority-matching algorithm.
        </p>
        <div class="hero-actions">
          <a class="button primary" href="#donor-form"><i class="fa-solid fa-user-plus"></i> Register Donor</a>
          <a class="button secondary" href="#priority-panel"><i class="fa-solid fa-ranking-star"></i> Run Priority Match</a>
          <a class="button danger-outline" href="#emergency-section"><i class="fa-solid fa-bell"></i> Emergency Request</a>
        </div>
        <p class="tagline"><i class="fa-solid fa-heart-pulse"></i> This system can help save lives during emergencies.</p>
      </div>
      <aside class="hero-card">
        <div class="metric">
          <span class="metric-label"><i class="fa-solid fa-users"></i> Active donors</span>
          <strong id="donorCount">0</strong>
        </div>
        <div class="metric">
          <span class="metric-label"><i class="fa-solid fa-kit-medical"></i> Emergency requests</span>
          <strong id="requestCount">0</strong>
        </div>
        <div class="metric">
          <span class="metric-label"><i class="fa-solid fa-circle-check"></i> System Status</span>
          <strong class="status-operational"><span class="status-dot"></span> Operational</strong>
        </div>
        <div class="metric live-clock-metric">
          <span class="metric-label"><i class="fa-solid fa-clock"></i> Live Clock</span>
          <strong id="liveClock">--:--:--</strong>
        </div>
        <div class="heartbeat-container">
          <div class="heartbeat-line" id="heartbeatLine"></div>
        </div>
      </aside>
    </header>

    <main class="dashboard">
      <section class="panel" id="donor-form">
        <div class="panel-head">
          <h2><i class="fa-solid fa-user-plus"></i> Register Donor</h2>
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
          <button class="button primary submit-button" type="submit"><i class="fa-solid fa-floppy-disk"></i> Save Donor</button>
        </form>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2><i class="fa-solid fa-magnifying-glass"></i> Search Donors</h2>
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
          <button class="button primary submit-button" type="submit"><i class="fa-solid fa-search"></i> Search</button>
        </form>
        <div id="searchResults" class="cards-grid"></div>
      </section>

      <section class="panel emergency-panel" id="emergency-section">
        <div class="panel-head">
          <h2><i class="fa-solid fa-triangle-exclamation emergency-icon-pulse"></i> Emergency Request</h2>
          <p>Capture urgent blood requests and make matching faster.</p>
          <div class="emergency-timer-bar" id="emergencyTimerBar">
            <div class="timer-display">
              <i class="fa-solid fa-stopwatch"></i>
              <span id="emergencyTimerText">Response Window: --:--</span>
            </div>
          </div>
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
          <button class="button primary submit-button" type="submit"><i class="fa-solid fa-paper-plane"></i> Create Request</button>
        </form>
      </section>

      <!-- Blood Compatibility Matrix -->
      <section class="panel wide-panel" id="compatibility-matrix">
        <div class="panel-head">
          <h2><i class="fa-solid fa-table-cells"></i> Blood Compatibility Matrix</h2>
          <p>Interactive reference showing which blood groups can donate to and receive from each other. Click any cell for details.</p>
        </div>
        <div class="matrix-wrapper">
          <table class="compat-table" id="compatTable">
            <thead>
              <tr>
                <th class="matrix-corner">Donor &rarr;<br>Recipient &darr;</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
        <div id="compatInfo" class="compat-info hidden">
          <i class="fa-solid fa-circle-info"></i>
          <span id="compatInfoText"></span>
        </div>
      </section>

      <section class="panel wide-panel" id="priority-panel">
        <div class="panel-head">
          <h2><i class="fa-solid fa-ranking-star"></i> Priority Matching</h2>
          <p>
            Initiate our intelligent priority matching engine to automatically rank and suggest the most suitable donors based on location proximity, previous donation history, and critical patient flags.
          </p>
        </div>
        <div class="priority-controls">
          <label>
            <span>Select Request</span>
            <select id="requestSelector"></select>
          </label>
          <button class="button secondary" id="runPriorityBtn" type="button"><i class="fa-solid fa-bolt"></i> Generate Priority List</button>
        </div>
        <div id="priorityResults" class="cards-grid"></div>
      </section>

      <section class="panel wide-panel">
        <div class="panel-head">
          <h2><i class="fa-solid fa-database"></i> System Data</h2>
          <p>Live, real-time synchronization of donor registries and critical emergency alerts.</p>
        </div>
        <div class="tables">
          <div>
            <h3><i class="fa-solid fa-users"></i> Donor Database</h3>
            <div id="donorList" class="cards-grid"></div>
          </div>
          <div>
            <h3><i class="fa-solid fa-bell"></i> Emergency Alerts</h3>
            <div id="requestList" class="cards-grid"></div>
          </div>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <p>&copy; 2026 Blood Donor Finder System &mdash; Built with Java, Hibernate, JSP &amp; jQuery</p>
    </footer>
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
