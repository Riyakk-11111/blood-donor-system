$(document).ready(function() {
    
    // Smooth scrolling
    $("a[href^='#']").on('click', function(e) {
        e.preventDefault();
        var target = this.hash;
        var $target = $(target);
        $('html, body').stop().animate({
            'scrollTop': $target.offset().top - 80
        }, 500, 'swing');
    });

    // Register Donor
    $('#registerForm').on('submit', function(e) {
        e.preventDefault();
        var data = $(this).serialize();
        $.post('register', data, function(res) {
            var $msg = $('#registerMsg');
            if (res.status === 'success') {
                $msg.text(res.message).removeClass('error').addClass('success');
                $('#registerForm')[0].reset();
            } else {
                $msg.text(res.message).removeClass('success').addClass('error');
            }
        }, 'json');
    });

    // Emergency Request
    $('#emergencyForm').on('submit', function(e) {
        e.preventDefault();
        var data = $(this).serialize();
        $.post('emergency', data, function(res) {
            var $msg = $('#emergencyMsg');
            if (res.status === 'success') {
                $msg.text('Emergency request dispatched immediately.').removeClass('error').addClass('success');
                $('#emergencyForm')[0].reset();
            } else {
                $msg.text('Failed to send request.').removeClass('success').addClass('error');
            }
        }, 'json');
    });

    // Search Donors
    $('#searchForm').on('submit', function(e) {
        e.preventDefault();
        var data = $(this).serialize();
        $.get('search', data, function(donors) {
            var $result = $('#searchResult');
            $result.empty();
            if (donors.length === 0) {
                $result.html('<p>No donors found matching criteria.</p>');
                return;
            }
            donors.forEach(function(d) {
                var card = '<div class="donor-card">' +
                             '<div class="donor-name">' + d.fullName + '</div>' +
                             '<div>Blood Group: <span class="b-group">' + d.bloodGroup + '</span></div>' +
                             '<div>Location: ' + d.city + '</div>' +
                             '<div>Contact: <a href="tel:' + d.phone + '">' + d.phone + '</a></div>' +
                           '</div>';
                $result.append(card);
            });
        }, 'json');
    });

    // Priority Match
    $('#runPriorityBtn').on('click', function() {
        var $btn = $(this);
        $btn.text('Analyzing...').prop('disabled', true);
        
        $.get('priority-match', function(matches) {
            var $result = $('#priorityResult');
            $result.empty();
            
            setTimeout(function() { // artificial delay for AI effect
                $btn.text('Run AI Priority Match').prop('disabled', false);
                
                if (matches.length === 0) {
                    $result.html('<p>No active emergency requests found.</p>');
                    return;
                }
                
                matches.forEach(function(match) {
                    var req = match.request;
                    var donors = match.donors;
                    var borderClass = req.urgencyLevel === 'CRITICAL' ? '' : (req.urgencyLevel === 'HIGH' ? 'priority-high' : 'priority-normal');
                    
                    var html = '<div class="priority-item ' + borderClass + '">' +
                                 '<h4>Request: ' + req.patientName + ' (' + req.bloodGroup + ')</h4>' +
                                 '<div style="color: var(--text-light); font-size: 0.9rem; margin-bottom: 10px;">Urgency: <strong>' + req.urgencyLevel + '</strong> | Location: ' + req.city + '</div>' +
                                 '<h5>' + match.donorsFound + ' Potential Donors Matched:</h5>' +
                                 '<div class="results-grid" style="margin-top: 10px;">';
                                 
                    if (donors.length === 0) {
                        html += '<p style="color: red; font-size: 0.9rem;">No direct matching donors found in the area. Escalating to global broadcast.</p>';
                    } else {
                        donors.forEach(function(d) {
                            html += '<div class="donor-card" style="background:#fefefe; padding: 10px;">' +
                                     '<div><strong>' + d.fullName + '</strong></div>' +
                                     '<div><a href="tel:' + d.phone + '">Call Now: ' + d.phone + '</a></div>' +
                                    '</div>';
                        });
                    }
                    html += '</div></div>';
                    $result.append(html);
                });
            }, 800);
        }, 'json');
    });

});
