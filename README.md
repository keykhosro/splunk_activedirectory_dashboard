# AD Security & Audit Dashboard for Splunk

A Splunk app for **Active Directory security and audit**. It combines two complementary data sources:

- **Event-driven monitoring** of Domain Controller security logs (`WinEventLog:Security`) — AD changes, group/user membership, GPO changes, attribute modifications, logon activity, password and lockout events.
- **LDAP-based security checks** using `SA-ldapsearch` — direct queries against AD for attribute misconfigurations, stale objects, weak configurations, and per-object investigation.

The app also ships a built-in **health check dashboard** that verifies required add-ons, lookup files, indexes, Domain Controllers, and audit event codes so you can confirm your environment is ready before relying on the audit panels.

---

## Dashboards

The app ships **10 dashboards** plus a setup page.

### 7 — Domain Controller event log dashboards

Require `Splunk_TA_windows`. Consume `sourcetype="WinEventLog:Security"` from Domain Controllers.

- **AD-DClogs** — health check (start here on a fresh install)
- **AD-AccountChanges** — user account changes
- **AD_GPOChanges** — Group Policy Object changes
- **AD_Group_Attribute_Changes** — group attribute changes
- **AD_Group_Lifecycle** — group creation and deletion
- **AD_Group_Membership_Changes** — group membership changes
- **AD_userauth** — user authentication activity

### 2 — LDAP security scan dashboards

Require `SA-ldapsearch` with a configured `default` LDAP domain.

- **ad-scan** — AD attribute security scan (misconfigurations and weaknesses)
- **ad_investigation** — per-object investigation

### 1 — LDAP query dashboard

Requires `SA-ldapsearch`.

- **ad-scan-ldap** — run custom LDAP queries against AD

### Setup

- **setup** — App Setup page (sets the Domain Controller index for the `DC-index` macro)

---

## Requirements

| Add-on | Requirement | Purpose |
|---|---|---|
| **Splunk_TA_windows** | Required | Windows Security event field extraction (event-driven dashboards). |
| **SA-ldapsearch** | Optional | Required only for `ad-scan-ldap`, `ad-scan`, and `ad_investigation` dashboards. |


---

## Installation

### From a release package

1. Download `AD_dashboard_searchhead-1.0.1.spl` from the [Releases](https://github.com/keykhosro/splunk_activedirectory_dashboard/releases) page or from the [Splunkbase](https://splunkbase.splunk.com/app/10070/) page.
2. In Splunk: **Apps → Manage Apps → Install app from file**.
3. Upload the `.spl` and restart Splunk if prompted.

### From source

Copy the `AD_dashboard_searchhead` folder into:

    $SPLUNK_HOME/etc/apps/

Then restart Splunk, or refresh the app configuration without a restart by visiting:

    https://<splunk-host>:<port>/en-US/debug/refresh

(admin login required)

---

## License

See [LICENSE](LICENSE).
