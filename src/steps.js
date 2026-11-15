// Lesson content for the 2x2 beginner method.
// Each step shows a case on the cube and an algorithm to play.
// If `setup` is missing, the case is "the cube just before `alg`".
// A step has `next` (one way forward) or `choices` (the learner picks a case).

const SUNE = "R U R' U R U2 R'";
const SUNE_BACKWARDS = "R U2' R' U' R U' R'";
const SWAP = "R U R' U' R' F R2 U' R' U' R U R' F'";
const TRIGGER = "R U R' U'";
const repeat = (alg, n) => Array(n).fill(alg).join(" ");

export const START = "notation";

export const STEPS = [
  {
    id: "notation",
    lesson: "Notation",
    title: "How to read moves",
    text:
      "Each letter is a quarter turn of one face, as if you were looking straight at that face. " +
      "R turns the right face, U the top (up) face, F the front face, all clockwise. " +
      "A ' (say \"prime\") means turn the other way. A 2 means turn it twice. " +
      "Play the moves and watch each face turn.",
    alg: "R R' U U' F F' R2 U2",
    setup: "U2' R2'",
    next: "fl-intro",
  },
  {
    id: "fl-intro",
    lesson: "First layer",
    title: "Build the first layer",
    text:
      "Pick a color for the bottom (here, white) and get all four white corners on the bottom so " +
      "their side colors match. The first two or three are usually easy to do by feel. " +
      "For a stuck corner, put it in the top layer directly above where it belongs (front right), " +
      "hold the cube so that spot is at the front right, and repeat the move sequence R U R' U' " +
      "until the corner drops in. How many times depends on which way its white sticker faces. " +
      "Which way does the white sticker face?",
    alg: "",
    choices: [
      { label: "White faces right", to: "fl-right" },
      { label: "White faces front", to: "fl-front" },
      { label: "White faces up", to: "fl-up" },
    ],
  },
  {
    id: "fl-right",
    lesson: "First layer",
    title: "White sticker faces right",
    text: "Do R U R' U' once. The corner drops into place with white on the bottom.",
    alg: repeat(TRIGGER, 1),
    next: "oll-intro",
  },
  {
    id: "fl-front",
    lesson: "First layer",
    title: "White sticker faces front",
    text: "Do R U R' U' five times. Keep the cube still and just repeat it.",
    alg: repeat(TRIGGER, 5),
    next: "oll-intro",
  },
  {
    id: "fl-up",
    lesson: "First layer",
    title: "White sticker faces up",
    text: "Do R U R' U' three times.",
    alg: repeat(TRIGGER, 3),
    next: "oll-intro",
  },
  {
    id: "oll-intro",
    lesson: "Top color",
    title: "Make the top all yellow",
    text:
      "Turn the cube over so the solved white layer is on the bottom. Now you only need one move " +
      "sequence, called Sune: R U R' U R U2 R'. Count the top corners that already show yellow on top. " +
      "How many are there?",
    alg: "",
    choices: [
      { label: "One", to: "oll-one" },
      { label: "None", to: "oll-none" },
      { label: "Two", to: "oll-two" },
    ],
  },
  {
    id: "oll-one",
    lesson: "Top color",
    title: "One yellow corner on top",
    text:
      "Turn the top layer until the yellow-on-top corner is at the front left. Then do Sune once. " +
      "If the top still is not all yellow, look again and repeat.",
    alg: SUNE,
    next: "pll-intro",
  },
  {
    id: "oll-none",
    lesson: "Top color",
    title: "No yellow corners on top",
    text:
      "Do Sune once. This will give you a different case, usually one yellow corner on top. " +
      "Then look again.",
    alg: SUNE,
    setup: `${SUNE_BACKWARDS} ${SUNE_BACKWARDS}`,
    next: "oll-intro",
  },
  {
    id: "oll-two",
    lesson: "Top color",
    title: "Two yellow corners on top",
    text: "Do Sune once from any angle. This gives you a different case. Then look again.",
    alg: SUNE,
    setup: "R U R' U' R' F R F'",
    next: "oll-intro",
  },
  {
    id: "pll-intro",
    lesson: "Top corners",
    title: "Put the top corners in place",
    text:
      "The top is all yellow, but the corners may be in the wrong spots. Look at the sides of the top layer. " +
      "If one side has two corners with matching colors, those are called headlights. " +
      "Do you see headlights?",
    alg: "",
    choices: [
      { label: "Yes, headlights", to: "pll-lights" },
      { label: "No headlights", to: "pll-none" },
    ],
  },
  {
    id: "pll-lights",
    lesson: "Top corners",
    title: "Headlights",
    text: `Hold the cube so the headlights are on the left side. Then do ${SWAP}.`,
    alg: SWAP,
    next: "finish",
  },
  {
    id: "pll-none",
    lesson: "Top corners",
    title: "No headlights",
    text: "Do the same move sequence once from any angle. You will then have headlights. Look again.",
    alg: SWAP,
    setup: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
    next: "pll-intro",
  },
  {
    id: "finish",
    lesson: "Finish",
    title: "Turn the top to finish",
    text: "Turn the top layer until every side matches. The cube is solved.",
    alg: "U",
  },
];
