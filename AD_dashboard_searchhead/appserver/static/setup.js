require([
    'jquery',
    'splunkjs/mvc',
    'splunkjs/mvc/simplexml/ready!'
], function($, mvc) {
    var APP_NAME = 'AD_dashboard_searchhead';
    var MACRO_NAME = 'DC-index';

    function getCsrfToken() {
        var name = 'splunkweb_csrf_token_8000=';
        var decoded = decodeURIComponent(document.cookie);
        var parts = decoded.split(';');
        for (var i = 0; i < parts.length; i++) {
            var c = parts[i].trim();
            if (c.indexOf(name) === 0) {
                return c.substring(name.length);
            }
        }
        return '';
    }

    function showMessage(html) {
        $('#message').html(html);
    }

    function updateMacro(indexName, onSuccess, onError) {
        var definition = 'index="' + indexName + '"';
        var url = '/en-US/splunkd/__raw/servicesNS/nobody/' + APP_NAME + '/configs/conf-macros/' + MACRO_NAME;

        var controller = new AbortController();
        var timeoutId = setTimeout(function() { controller.abort(); }, 20000);

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Splunk-Form-Key': getCsrfToken(),
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: 'definition=' + encodeURIComponent(definition),
            signal: controller.signal
        })
        .then(function(response) {
            clearTimeout(timeoutId);
            return response.text().then(function(text) {
                return { status: response.status, text: text };
            });
        })
        .then(function(result) {
            if (result.status === 200) {
                showMessage('<span style="color:green;">Saved!</span>');
                onSuccess();
            } else {
                showMessage('<span style="color:red;">Save failed (' + result.status + '):</span><pre style="white-space:pre-wrap;">' + result.text.replace(/</g, '&lt;') + '</pre>');
                onError();
            }
        })
        .catch(function(err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                showMessage('<span style="color:red;">Request timed out.</span>');
            } else {
                showMessage('<span style="color:red;">Network error: ' + err.message + '</span>');
            }
            onError();
        });
    }

    function markConfigured(onDone) {
        var url = '/en-US/splunkd/__raw/servicesNS/nobody/' + APP_NAME + '/configs/conf-app/install';
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Splunk-Form-Key': getCsrfToken(),
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: 'is_configured=1'
        }).then(function() { onDone(); }).catch(function() { onDone(); });
    }

    $('#save-btn').on('click', function() {
        var idx = $.trim($('#index-input').val());
        if (idx === '') {
            showMessage('<span style="color:red;">Please enter an index name.</span>');
            return;
        }
        showMessage('<span style="color:#555;">Saving...</span>');
        updateMacro(idx, function() {
            markConfigured(function() {
                setTimeout(function() {
                    window.location.href = '/app/' + APP_NAME;
                }, 800);
            });
        }, function() {
            // error already displayed
        });
    });

    $('#index-input').on('keypress', function(e) {
        if (e.which === 13) { $('#save-btn').click(); }
    });
});