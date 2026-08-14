# SHREE STEEL — Dynamic Website V5

## Easiest way to launch on Windows

**Double-click `START SHREE STEEL.bat`.**

It checks for Node.js, starts the Node.js server and opens the website at:

`http://localhost:3000`

Keep the black terminal window open while the website is running.

### If you prefer the terminal

Open this folder in VS Code Terminal and run:

```bash
npm start
```

Then open `http://localhost:3000`.

**Do not open `public/index.html` directly and do not use VS Code Live Server.** The site is dynamic and loads products/brands through the Node.js API.

## Admin

Open:

`http://localhost:3000/admin`

Development password:

`ShreeSteel@2026`

Change the password before production by setting `ADMIN_PASSWORD`.

## Included dynamic catalogue

### Brands
- Bangur Cement — uploaded logo
- Everest — uploaded logo
- GK TMT — uploaded logo
- HIL / BirlaNu — uploaded logo
- Jindal Panther — uploaded logo
- MSP — uploaded logo
- Jindal Cement
- Jindal Bricks

### Products
- TMT Bars
- Cement
- Roofing Sheets
- Structural Steel
- Bricks
- Pipes & Steel Products

## Calculator

The TMT calculator intentionally contains only:
- Number of Bars
- Weight of One Bar (kg)
- Price per kg (₹)
- Total Weight
- Total Amount

No GST field, diameter field or length field is included.

## Important

The public site must be launched through Node.js because `/api/products`, `/api/brands` and `/api/enquiries` are backend endpoints. Opening `index.html` directly will not load the dynamic catalogue.
