# GitLab Shared Templates

Easily manage and insert custom Markdown templates from a shared GitLab repository directly into GitLab Issues, Merge Requests, and Work Items. 

> [!NOTE]
> **Why use this?** In GitLab, sharing description templates across multiple projects/groups natively [requires a Premium or Ultimate subscription](https://docs.gitlab.com/user/group/custom_project_templates/). Free GitLab tiers are restricted to project-scoped templates only. This extension bypasses that limitation by allowing you to host all team templates in a single, central repository and load them dynamically across all of your projects.

This browser extension is fully compatible with **Google Chrome** (and other Chromium browsers like Edge, Brave, and Opera) and **Mozilla Firefox**.

---

## ✨ Features

* **Centralized Team Templates:** Store all your team's Markdown templates (`.md` files) in a single GitLab repository. Changes are updated instantly for everyone using the extension.
* **Seamless UI Integration:** Inserts a clean, native-feeling template dropdown right next to GitLab's default description template selector.
* **Self-Hosted GitLab Support:** Works out of the box with standard `gitlab.com` as well as custom enterprise GitLab domains (e.g. `gitlab.company.com`).
* **Secure and Private:** Your configurations and GitLab Personal Access Tokens are stored securely in your browser's local storage and are never sent to third-party servers.

---

## 🚀 How It Works

1. **Create your Template Repository:** Store your standard Markdown templates as `.md` files inside any GitLab repository (can be public or private).
2. **Install the Extension:** Download the extension from the official stores or build it from source.
3. **Configure Settings:** Click the extension icon to open the options page:
   * Paste your **Templates Repository URL**.
   * **Personal Access Token (PAT):** Only required if the templates repository is private **and** you do not have an active login session open in the current browser for that GitLab instance. If you are already logged in to GitLab on the same browser, the background requests use your active browser session automatically, and a PAT is not needed.
   * If your company uses a self-hosted GitLab instance, fill in the **Custom GitLab Domain** field.
4. **Use Your Templates:** Go to any New Issue, New Merge Request, or Work Item page on GitLab. Select a template from the new dropdown, and it will insert instantly.

---

## 🔌 Installation

### Official Extension Stores
The extension is available for direct installation in the browser stores:
* **Chrome Web Store** (for Google Chrome, Microsoft Edge, Brave, Opera, etc.)
* **Firefox Add-ons (AMO)** (for Mozilla Firefox)

### Installing from Source / Developer Mode (Local Setup)
If you prefer to build the extension manually or install it locally for development, follow these steps:

#### Google Chrome, Microsoft Edge, Brave, or Opera:
1. Download or clone this repository.
2. Build the project using Node (see [Development](#-development) below) to generate the `dist` folder.
3. Open your browser and go to `chrome://extensions` (or `edge://extensions`).
4. Enable **Developer mode** (top-right toggle).
5. Click **Load unpacked** and select the **`dist`** directory.

#### Mozilla Firefox:
1. Download or clone this repository.
2. Build the project using Node (see [Development](#-development) below) to generate the `dist-firefox` folder.
3. Open Firefox and go to `about:debugging`.
4. Click **This Firefox** on the left menu.
5. Click **Load Temporary Add-on...** and select `manifest.json` inside the **`dist-firefox`** folder.

---

## 🛠️ Development

This extension is built using React, TypeScript, and Vite.

### Getting Started:
```bash
# 1. Install dependencies
pnpm install

# 2. Run developer environment
pnpm dev

# 3. Compile the production extension builds
pnpm build
```

### Packaging:
To generate production-ready ZIP packages for Chrome and Firefox, run the packaging utility:
```bash
node packExtension.js
```
By default, this will automatically bump the patch version, compile the builds, and output compliant ZIP archives in the `build/` folder.

You can customize this behavior using CLI flags:
* **No Bump:** Keep the current version from `manifest.json` without incrementing it:
  ```bash
  node packExtension.js -n
  ```
* **Custom Bump Step:** Increment a specific semver segment (`patch`, `minor`, `major`):
  ```bash
  node packExtension.js -b minor
  ```
* **Specific Version:** Force a specific version override (e.g. `2.0.0`):
  ```bash
  node packExtension.js -v 2.0.0
  ```

---

## 🤝 Contributing

Contributions are highly welcome! We appreciate help in making this extension better for everyone.

You can contribute in several ways:
* **Bug Fixes:** Open an issue or submit a pull request if you find something that isn't working correctly.
* **New Features:** Share your ideas or implement new features to improve the template selection workflow.
* **Translation & Localization:** Help translate the extension UI and settings page into more languages.
* **Documentation:** Improve this README, add guides, or improve code comments.

Feel free to fork the repository, make your changes, and submit a pull request!
