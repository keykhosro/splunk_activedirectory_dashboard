require([
    'jquery',
    'splunkjs/mvc',
    'splunkjs/mvc/simplexml/ready!'
], function($, mvc) {
    var APP_NAME = 'AD_dashboard_searchhead';
    var MACRO_NAME = 'DC-index';
    var REDIRECT_DELAY = 1500; // ms
    var VERIFY_RETRIES = 8;    // how many times we poll before redirecting anyway

    function getCsrfToken() {
        // Match any port, not just 8000
        var m = document.cookie.match(/(?:^|;\s*)splunkweb_csrf_token_\d+=([^;]+)/);
        return m ? decodeURIComponent(m[1]) : '';
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function showMessage(html) {
        $('#message').html(html);
    }

    function request(method, url, body, callback) {
        var controller = new AbortController();
        var timeoutId = setTimeout(function() { controller.abort(); }, 20000);

        var headers = { 'X-Requested-With': 'XMLHttpRequest' };
        if (method === 'POST') {
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
            headers['X-Splunk-Form-Key'] = getCsrfToken();
        } else {
            headers['Accept'] = 'application/json';
        }

        fetch(url, {
            method: method,
            credentials: 'same-origin',
            headers: headers,
            body: method === 'POST' ? (body || '') : undefined,
            signal: controller.signal
        }).then(function(response) {
            clearTimeout(timeoutId);
            return response.text().then(function(text) {
                callback(null, { status: response.status, text: text });
            });
        }).catch(function(err) {
            clearTimeout(timeoutId);
            callback(err);
        });
    }


    function updateMacro(indexName, onSuccess, onError) {
        var definition = 'index="' + indexName + '"';
        var url = '/en-US/splunkd/__raw/servicesNS/nobody/' + APP_NAME +
                  '/configs/conf-macros/' + MACRO_NAME;

        request('POST', url, 'definition=' + encodeURIComponent(definition), function(err, result) {
            if (err) {
                showMessage('<span style="color:red;">' +
                    (err.name === 'AbortError' ? 'Request timed out.' : 'Network error: ' + escapeHtml(err.message)) +
                    '</span>');
                return onError();
            }
            if (result.status === 200) {
                showMessage('<span style="color:green;">Macro saved.</span>');
                onSuccess();
            } else {
                showMessage('<span style="color:red;">Macro save failed (' + result.status +
                    '):</span><pre style="white-space:pre-wrap;">' +
                    escapeHtml(result.text) + '</pre>');
                onError();
            }
        });
    }


    function markConfigured(onDone) {
        var url = '/en-US/splunkd/__raw/servicesNS/nobody/' + APP_NAME +
                  '/configs/conf-app/install';

        // IMPORTANT: send both flags. Missing "state" leaves the app in an
        // inconsistent state on several Splunk versions and causes the loop.
        request('POST', url, 'is_configured=1&state=enabled', function(err, result) {
            if (err || result.status !== 200) {
                showMessage('<span style="color:red;">Could not mark app as configured' +
                    (err ? ': ' + escapeHtml(err.message) : ' (' + result.status + ')') + '</span>');
            }
            onDone();
        });
    }


    function reloadApp(onDone) {
        var url = '/en-US/splunkd/__raw/services/apps/local/' + APP_NAME + '/_reload';
        request('POST', url, '', function() { onDone(); }); // best-effort
    }


    function isConfigured(callback) {
        var url = '/en-US/splunkd/__raw/servicesNS/nobody/' + APP_NAME +
                  '/configs/conf-app/install?output_mode=json';

        request('GET', url, null, function(err, result) {
            if (err || !result || result.status !== 200) return callback(false);
            try {
                var data = JSON.parse(result.text);
                var entry = data && data.entry && data.entry[0];
                var content = entry && entry.content;
                callback(!!content && String(content.is_configured) === '1');
            } catch (e) {
                callback(false);
            }
        });
    }

    function verifyAndRedirect(attempt) {
        attempt = attempt || 0;
        isConfigured(function(ok) {
            if (ok) {
                showMessage('<span style="color:green;">Configuration saved. Redirecting…</span>');
                setTimeout(function() {
                    window.location.replace('/app/' + APP_NAME);
                }, REDIRECT_DELAY);
                return;
            }
            if (attempt < VERIFY_RETRIES) {
                showMessage('<span style="color:#555;">Waiting for Splunk to reload the app config… (' +
                    (attempt + 1) + '/' + VERIFY_RETRIES + ')</span>');
                setTimeout(function() { verifyAndRedirect(attempt + 1); }, 800);
            } else {
                showMessage('<span style="color:#b58900;">Saved on disk, but Splunk has not reloaded ' +
                    'the app config yet. Try refreshing the page, or restart Splunk.</span>');
                setTimeout(function() {
                    window.location.replace('/app/' + APP_NAME);
                }, REDIRECT_DELAY * 2);
            }
        });
    }


    $('#save-btn').on('click', function() {
        var idx = $.trim($('#index-input').val());
        if (idx === '') {
            showMessage('<span style="color:red;">Please enter an index name.</span>');
            return;
        }

        showMessage('<span style="color:#555;">Saving…</span>');

        updateMacro(idx, function() {
            markConfigured(function() {
                reloadApp(function() {
                    verifyAndRedirect(0);
                });
            });
        }, function() {
            /* error already shown by updateMacro */
        });
    });

    $('#index-input').on('keypress', function(e) {
        if (e.which === 13) { $('#save-btn').click(); }
    });
});
