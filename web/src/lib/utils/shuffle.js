// Fisher-Yates shuffle algorithm
export function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Random number in range (inclusive)
export function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

// Random integer in range (inclusive)
export function randomIntInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
