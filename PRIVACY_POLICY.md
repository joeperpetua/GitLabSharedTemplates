# Privacy Policy for GitLab Shared Templates

**Last Updated:** July 14, 2026

Your privacy is extremely important to us. This Privacy Policy details how the **GitLab Shared Templates** browser extension ("the Extension") handles, stores, and transmits your information.

---

## 1. Overview and Core Philosophy
The Extension is built with a privacy-first approach. 
* **No Central Servers:** We do not run any central servers, databases, or tracking systems.
* **No Telemetry/Analytics:** We do not collect, monitor, or track your browsing history, clicks, usage analytics, or personal behavior.
* **Direct Communication:** All network communication is performed directly from your browser to your specified GitLab instances.

---

## 2. Information Collected and Storage
The Extension stores configuration settings required to fetch your markdown templates. This data includes:
1. **Repository URL:** The URL of the GitLab project containing your Markdown templates.
2. **Personal Access Token (PAT):** An optional token used to authenticate API requests to private GitLab repositories.
3. **Custom GitLab Domain:** An optional setting if you run a self-hosted or enterprise GitLab instance (e.g., `gitlab.mycompany.com`).
4. **User Preferences:** General preferences such as language, developer logging toggle, and whether to overwrite or append templates.

### How and Where Data is Stored
* All configuration details, including the GitLab Personal Access Token, are stored locally on your device using the `chrome.storage.sync` API.
* Depending on your Google Chrome settings, this data may be synchronized across your own devices where you are logged into the same Google account.
* **No credentials, tokens, or settings are ever transmitted to us or any third parties.**

---

## 3. Network Communication and Third-Party Access
To fetch and display your templates, the Extension communicates directly with:
1. **GitLab.com:** If you use public repositories hosted on the official GitLab domain.
2. **Your Custom Domain:** If you configure a self-hosted GitLab instance.

### What is Sent
The Extension sends HTTP requests directly to the GitLab REST API (v4) of the configured instance. These requests include:
* Your optional Personal Access Token (passed in the `PRIVATE-TOKEN` header) to authorize access to your repository.
* The repository project path to retrieve the repository file tree and fetch `.md` template contents.

---

## 4. Permissions Used
The Extension requests the following permissions to function:
* **`storage`:** To store and sync your repository settings, PAT, and preferences locally in your browser.
* **`scripting`:** To dynamically register and inject the content script on your custom GitLab domains.
* **`activeTab`:** To safely interact with the active GitLab tab and show options without requiring permanent access to all domains.
* **Host Permissions (`https://gitlab.com/*` & optional custom domains):** To allow the Extension to fetch templates from your GitLab repository and inject the UI dropdown on GitLab merge request and issue pages.

---

## 5. Security of Your Personal Access Token (PAT)
Your Personal Access Token is sensitive. We recommend using a token with the minimum necessary scope (e.g., `read_api` or `read_repository`) for this extension. Because the token is saved in `chrome.storage.sync`, it is secured by your browser's native storage sandbox.

---

## 6. Changes to this Policy
We may update this Privacy Policy from time to time. Any changes will be updated directly in this file and reflected in the Extension's distribution package.

---

## 7. Contact
If you have any questions or feedback about this privacy policy, please open an issue in the project repository.
