# JBS Store - Camping & Outdoors Theme

This is the customized **Camping & Outdoors** theme for the JBS Store, built on top of the BigCommerce Stencil framework and the Cornerstone base theme (v1.0.18 Epic Superstore customization).

---

## 📋 Prerequisites

Before setting up the project locally, ensure you have the following installed on your machine:

1. **Node.js & npm**
   * **Node.js**: `v20.x` (LTS)
   * **npm**: `v10.x`
   
   > [!IMPORTANT]
   > The `package-lock.json` file in this repository was generated using Node 20 and npm 10. You **must** use these versions to prevent lockfile conflicts. If you use a different version, delete `package-lock.json` before running `npm install` and do not commit the modified lockfile.

2. **Grunt CLI**
   Used for icon sprite generation and linting.
   ```bash
   npm install -g grunt-cli
   ```

3. **BigCommerce Stencil CLI**
   Used to run the local development server and compile the theme assets.
   ```bash
   npm install -g @bigcommerce/stencil-cli
   ```

---

## 🚀 Local Installation & Setup

Follow these steps to set up and run the theme locally:

### 1. Install Dependencies
Run the installation command in the project root:
```bash
npm install
```
*Note: If you are updating or adding package dependencies, run `npm update <package_name>` instead of a blanket `npm install` to keep the dependency tree clean.*

### 2. Configure BigCommerce Connection
To connect the local Stencil server to your BigCommerce storefront, you need two configuration files in the root directory:

#### A. `config.stencil.json`
This file configures the local port, target store URL, and layout settings.
Create or update `config.stencil.json` in the root:
```json
{
  "customLayouts": {
    "brand": {},
    "category": {},
    "page": {},
    "product": {}
  },
  "normalStoreUrl": "https://jbs.mybigcommerce.com/",
  "port": "42134",
  "packageManager": "npm"
}
```

#### B. `secrets.stencil.json`
This file stores your BigCommerce Stencil API Access Token.
Find it in Z drive - Z:\New BWM Store BigCommerce\DOCUMENTATION\JBS Store
Create `secrets.stencil.json` in the root:
```json
{
  "accessToken": "YOUR_ACCESS_TOKEN"
}
```

> [!WARNING]
> `secrets.stencil.json` contains sensitive API credentials and is ignored by Git in `.gitignore`. **Never commit this file or expose your access tokens publicly.**

#### How to obtain a Stencil Access Token:
1. Log in to your BigCommerce Control Panel.
2. Go to **Advanced Settings** > **API Accounts** (or **Storefront** > **My Themes** depending on store version).
3. Create a **Theme API Token** (Stencil CLI Token) with read-only/read-write permissions for the storefront.
4. Copy the generated Access Token into your `secrets.stencil.json` file.

---

## 🛠️ Development Workflow Commands

Once configured, use the following commands to develop, build, and test your changes:

### Start Local Development Server
Launch the local Stencil server:
```bash
stencil start
```
By default, this will compile the assets and launch the store preview at:
* **Proxy Server**: `http://localhost:42134` (configured in `config.stencil.json`)

### Compile Assets
* **Development Build** (Includes source maps):
  ```bash
  npm run buildDev
  ```
* **Production Build** (Minified, optimized):
  ```bash
  npm run build
  ```

### Manage Icons
This theme packages individual SVG icons into a single sprite sheet for performance. If you add or modify any SVG files inside `assets/icons/`, regenerate the sprite sheet:
```bash
grunt svgstore
```
*Usage in Handlebars templates:*
```html
<svg><use xlink:href="#icon-svgFileName" /></svg>
```

### Run Tests & Code Quality
* **Run Jest Unit Tests**:
  ```bash
  npm test
  ```
* **Lint Stylesheets**:
  ```bash
  npm run stylelint
  ```
* **Auto-fix Lint Errors**:
  ```bash
  npm run stylelint:fix
  ```

---

## 📦 Bundling and Uploading the Theme

When your changes are ready to deploy to BigCommerce:

1. **Bundle the Theme**
   Run the Stencil command to package the theme into a zip file:
   ```bash
   stencil bundle
   ```
   This compiles assets for production and creates a zip file (e.g. `JBS-store-theme-1.0.18.zip`) in the project root.

2. **Upload to BigCommerce**
   * Log into the BigCommerce Control Panel.
   * Navigate to **Storefront** > **My Themes**.
   * Click **Upload a Theme** and select the generated zip file.
   * Once uploaded, click the **`...`** menu on the new theme and select **Apply** to activate it.

---

## 📝 Developer Guidelines

* **Page-Scoped Javascript**: JavaScript logic is scoped to specific page types. Dynamic imports are managed through `assets/js/app.js`. Add page-specific JS modules in `assets/js/theme/`.
* **Custom Styles**: Centralize style customizations in `assets/scss/custom/_custom.scss` to avoid editing vendor or Citadel framework modules.
* **Read-Only Directories**: Avoid modifying the base Citadel, Foundation, or vendor SCSS settings. These folders are located in `assets/scss/components/citadel/`, `assets/scss/settings/`, etc.
