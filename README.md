# AD Security & Audit Dashboard for Splunk

Splunk app for Active Directory security and audit: monitors AD changes, detects
group/user/password/lockout anomalies and attribute misconfigurations, provides
LDAP query dashboards, and verifies add-ons, lookups, indexes, Domain Controllers,
and audit event codes.

## Installation

Copy the `AD_dashboard_searchhead` folder into:

    $SPLUNK_HOME/etc/apps/

Then restart Splunk or reload the app.

## Requirements

- **Splunk_TA_windows** — required (Windows Security event field extraction)
- **SA-ldapsearch** — optional (required only for `ldap-*` dashboards)

## License

See [LICENSE](LICENSE).