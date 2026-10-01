# Color Walk

Color Walk is a small React frontend that shows a random hex color each time the page loads. The page background is set to that color, and the current date is shown above the title.

This is v1 of the project. It is frontend-only for now.

## Requirements

- Node.js 20 LTS or 22 LTS
- npm

The app may run on other Node versions, but Vite officially targets the LTS lines above.

## Run Locally

Install dependencies:

```sh
npm install
```

Start the development server:

```sh
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://127.0.0.1:5173/
```

If that port is already in use, Vite will print a different port. Use the URL shown in the terminal.

## Build

Create a production build:

```sh
npm run build
```

The built files are written to `dist/`.

## Preview The Production Build

After building, preview the production output locally:

```sh
npm run preview
```

Open the URL printed by Vite.

## Current Behavior

- A new random hex color is generated on each page load.
- The displayed hex value and page background use the same color.
- The date is generated from the browser's current date.
- No backend is required for v1.

## Future Backend Hook

The current random color logic lives in `src/App.jsx`. When a backend service is added, that local color generator can be replaced with a call to an API endpoint such as:

```text
GET /api/today-color
```
