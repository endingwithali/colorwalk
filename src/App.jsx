import { useMemo } from "react";

const HEX_DIGITS = "0123456789ABCDEF";

function createRandomHexColor() {
  let color = "#";

  for (let index = 0; index < 6; index += 1) {
    color += HEX_DIGITS[Math.floor(Math.random() * HEX_DIGITS.length)];
  }

  return color;
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

export default function App() {
  const color = useMemo(() => createRandomHexColor(), []);
  const displayDate = formatDisplayDate(new Date());

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
