import { generate } from "random-words"; // Correct ES6 import

export const generateMessage = () => {
  const words1 = generate({ exactly: 8, join: " " }); // First line
  const words2 = generate({ exactly: 8, join: " " }); // Second line
  return `${capitalize(words1)}.\n${capitalize(words2)}.`; // Two lines
};

const capitalize = (sentence) => sentence.charAt(0).toUpperCase() + sentence.slice(1);
