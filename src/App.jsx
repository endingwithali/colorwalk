import { useMemo } from "react";

const HEX_DIGITS = "0123456789ABCDEF";
const DAILY_COLOR_STORAGE_KEY = "colorwalk.dailyColor";

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

function getDailyColor(date) {
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
  const color = useMemo(() => getDailyColor(today), [today]);
  const displayDate = formatDisplayDate(today);

  return (
    <main className="color-walk" style={{ backgroundColor: color }}>
      <header className="color-walk__header" aria-label="Color Walk">
        <h1>COLOR WALK</h1>
        <p>{displayDate}</p>
      </header>

      <p className="color-walk__hex" aria-label={`Today's color is ${color}`}>
        {color}
      </p>
    </main>
  );
}
