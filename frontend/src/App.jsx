import { useEffect, useMemo, useState } from "react";

const HEX_DIGITS = "0123456789ABCDEF";
const DAILY_COLOR_STORAGE_KEY = "colorwalk.dailyColor";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8080";
const COLOR_API_TIMEOUT_MS = 2500;

function createRandomHexColor() {
  let color = "#";

  for (let index = 0; index < 6; index += 1) {
    color += HEX_DIGITS[Math.floor(Math.random() * HEX_DIGITS.length)];
  }

  return color;
}

function formatStorageDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
    .format(date)
    .toLowerCase();
}

function getStoredOrCreateLocalColor(date) {
  const generatedDate = formatStorageDate(date);
  const fallbackColor = createRandomHexColor();

  try {
    const storedDailyColor = window.localStorage.getItem(DAILY_COLOR_STORAGE_KEY);

    if (storedDailyColor) {
      const parsedDailyColor = JSON.parse(storedDailyColor);

      if (parsedDailyColor.generatedDate === generatedDate && parsedDailyColor.color) {
        return parsedDailyColor.color;
      }
    }

    window.localStorage.setItem(
      DAILY_COLOR_STORAGE_KEY,
      JSON.stringify({ color: fallbackColor, generatedDate }),
    );
  } catch {
    return fallbackColor;
  }

  return fallbackColor;
}

export default function App() {
  const today = useMemo(() => new Date(), []);
  const [dailyColor, setDailyColor] = useState({ color: null, source: "loading" });
  const displayDate = formatDisplayDate(today);

  useEffect(() => {
    const controller = new AbortController();
    let didCancel = false;
    const timeoutId = window.setTimeout(() => controller.abort(), COLOR_API_TIMEOUT_MS);

    async function loadUniversalColor() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/colors/today`, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Color API returned ${response.status}`);
        }

        const payload = await response.json();

        if (!payload.colorHex) {
          throw new Error("Color API response did not include colorHex");
        }

        window.clearTimeout(timeoutId);
        setDailyColor({ color: payload.colorHex, source: "universal" });
      } catch (error) {
        window.clearTimeout(timeoutId);

        if (didCancel) {
          return;
        }

        if (error.name !== "AbortError") {
          setDailyColor({
            color: getStoredOrCreateLocalColor(today),
            source: "local",
          });
        } else {
          setDailyColor({
            color: getStoredOrCreateLocalColor(today),
            source: "local",
          });
        }
      }
    }

    loadUniversalColor();

    return () => {
      didCancel = true;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [today]);

  const displayedColor = dailyColor.color ?? "#FFFFFF";

  return (
    <main className="color-walk" style={{ backgroundColor: displayedColor }}>
      <header className="color-walk__header" aria-label="Color Walk">
        <h1>COLOR WALK</h1>
        <p>{displayDate}</p>
      </header>

      <p className="color-walk__hex" aria-label="Today's color">
        {dailyColor.color ?? "loading"}
      </p>

      {dailyColor.source === "local" ? (
        <p className="color-walk__sync-warning" role="status">
          This is a local color, not the universal color of the day, because Color Walk
          could not synchronize with the server.
        </p>
      ) : null}
    </main>
  );
}
