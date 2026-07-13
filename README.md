# GitLab Shared Templates Extension (Manifest V3)

A modern, premium Cross-Browser extension (Chrome & Firefox) that integrates custom Markdown templates from any GitLab repository (public or private) directly into GitLab Issues and Merge Requests. Built using React, TypeScript, Vite, and Tailwind CSS v4.

---

## 🚀 Key Features

* **Vibrant & Modern UI Settings**: Styled with a dark mode theme, orange/pink gradients, and dynamic visual indicators.
* **CORS-Free Backend Worker**: Background service worker routes GitLab REST API requests to circumvent CORS limitations.
* **Smart GitLab URL Parsing**: Handles different URL configurations (e.g. self-hosted GitLab domains, subgroups, `.git` suffixes, branch/file subpages).
* **Live Connection Test**: Allows users to test connection credentials immediately in Options and see exactly how many templates were found before saving.
* **Dynamic Content Script Injection**: Uses dynamic host permissions (`chrome.permissions`) and scripting API (`chrome.scripting.registerContentScripts`) to support self-hosted GitLab domains without requiring global `<all_urls>` permissions.
* **Cursor-Targeted Insertion**: Appends the template at the exact cursor position inside the textarea, and automatically handles whitespace padding.
* **SPA/Turbo Navigation Support**: Uses a robust DOM `MutationObserver` to ensure the dropdown is injected on page updates without a hard reload.
* **Automatic Live Updates**: Listens to storage changes to reload the template lists instantly on existing tabs when you update settings.

---

## 🛠️ Tech Stack

1. **Framework**: Vite + `@crxjs/vite-plugin` for Manifest V3 extension packaging.
2. **UI/Components**: React 19 + Lucide Icons.
3. **Styling**: Tailwind CSS v4 (with zero-preflight scoping for content scripts to prevent host-site layout distortion).
4. **Languages**: TypeScript + ES2023.

---

## 📂 Project Architecture

```
GLSharedTemplates/
├── dist/                      # Packaged extension output (unpacked)
├── src/
│   ├── background/
│   │   └── index.ts          # Service worker for API requests and dynamic scripts
│   ├── content/
│   │   └── index.tsx         # Mutation observer & DOM injector for dropdowns
│   ├── options/
│   │   ├── index.tsx         # Settings mounting point
│   │   └── OptionsApp.tsx    # Settings Form, permission requests, connection test UI
│   ├── utils/
│   │   └── gitlab.ts         # URL parsing and domain normalization utility functions
│   ├── index.css             # Tailwind v4 import stylesheet
│   └── vite-env.d.ts
├── index.html                 # Standard index page
├── options.html               # Settings entrypoint
├── manifest.json              # Extension schema (Manifest V3)
├── package.json               # Node packages and build scripts
├── tsconfig.json              # TypeScript root configuration
├── tsconfig.app.json          # TypeScript app config with Chrome types
└── vite.config.ts             # Vite configuration with tailwindcss() & crx()
```

---

## 📦 How to Build and Package

### 1. Install Dependencies
Run the command below in the project directory:
```bash
pnpm install
```

### 2. Compile for Production
Compile the project to generate the production build in the `dist/` directory:
```bash
pnpm run build
```

---

## 🔌 How to Load the Extension in Your Browser

### For Google Chrome, Microsoft Edge, or Brave:
1. Open the browser and go to `chrome://extensions` (or `edge://extensions` in Edge).
2. Toggle **Developer mode** on in the top-right corner.
3. Click **Load unpacked** in the top-left corner.
4. Select the **`dist`** directory inside the `GLSharedTemplates` folder.
5. The extension is now loaded! Click the extension icon in your browser toolbar to open the settings.

### For Mozilla Firefox:
1. Open Firefox and enter `about:debugging` in the address bar.
2. Click **This Firefox** on the left menu.
3. Click **Load Temporary Add-on...** under Temporary Extensions.
4. Navigate to the **`dist`** folder and select `manifest.json`.
5. The extension will remain loaded until you restart Firefox.

---

## ⚙️ How to Configure Settings

Click the extension icon in your toolbar to open the **Options Page**.

1. **Custom GitLab Domain**: (Optional) Enter your company's self-hosted GitLab instance URL (e.g. `https://gitlab.mycompany.com`). If left blank, it defaults to `https://gitlab.com`.
2. **Templates Repository URL**: Paste the full GitLab project URL where your `.md` template files are stored (e.g. `https://gitlab.com/john_doe/my-markdown-templates`).
3. **Personal Access Token (PAT)**: (Optional) If your templates repository is private, create a GitLab Personal Access Token with the `read_api` scope and paste it here.
4. **Test Connection**: Click this button to run a connection test. The extension will contact the GitLab API and return the number of templates found or a descriptive error.
5. **Save Settings**: Click to store settings. If you entered a custom domain, the browser will prompt you to grant the required host permissions for that domain.

Once configured, go to any GitLab issue (`/issues/new` or `/issues/1`) or merge request (`/merge_requests/new` or `/merge_requests/1`), and you will see a dropdown selector in the description area. Select any markdown file, and it will be inserted directly at your cursor position!
