import { shuffleQuestion } from "../BranpyLive";

function makeQ(correct) {
  return {
    id: "q1",
    question: "Qual e a capital do Brasil?",
    alternatives: ["Sao Paulo", "Brasilia", "Rio de Janeiro", "Salvador"],
    correct,
    category: "Geografia",
    explanation: "Brasilia e a capital federal desde 1960.",
  };
}

test("preserves all alternatives after shuffle", () => {
  for (let i = 0; i < 50; i++) {
    const q = makeQ(1);
    const s = shuffleQuestion(q);
    expect(s.alternatives.sort()).toEqual(q.alternatives.sort());
    expect(s.alternatives.length).toBe(q.alternatives.length);
  }
});

test("correct answer appears in the position indicated by correct index", () => {
  for (let i = 0; i < 100; i++) {
    const q = makeQ(1);
    const s = shuffleQuestion(q);
    const answerText = q.alternatives[1];
    expect(s.alternatives[s.correct]).toBe(answerText);
  }
});

test("correct answer is not always at index 0", () => {
  let positions = new Set();
  const originalCorrect = 2;
  for (let i = 0; i < 200; i++) {
    const q = makeQ(originalCorrect);
    const s = shuffleQuestion(q);
    positions.add(s.correct);
    expect(s.alternatives[s.correct]).toBe(q.alternatives[originalCorrect]);
  }
  expect(positions.size).toBeGreaterThan(1);
});

test("correct answer is not always at index 0 with correct=0", () => {
  let positions = new Set();
  for (let i = 0; i < 200; i++) {
    const q = makeQ(0);
    const s = shuffleQuestion(q);
    positions.add(s.correct);
  }
  expect(positions.size).toBeGreaterThan(1);
});

test("does not mutate original question", () => {
  const q = makeQ(3);
  const original = { ...q, alternatives: [...q.alternatives] };
  shuffleQuestion(q);
  expect(q.alternatives).toEqual(original.alternatives);
  expect(q.correct).toBe(original.correct);
});

test("handles questions with only 2 alternatives", () => {
  const q = { ...makeQ(0), alternatives: ["Opcao A", "Opcao B"] };
  const s = shuffleQuestion(q);
  expect(s.alternatives.length).toBe(2);
  expect(s.alternatives).toContain("Opcao A");
  expect(s.alternatives).toContain("Opcao B");
});

test("handles single alternative without error", () => {
  const q = { ...makeQ(0), alternatives: ["Unica"] };
  const s = shuffleQuestion(q);
  expect(s.alternatives).toEqual(["Unica"]);
  expect(s.correct).toBe(0);
});

test("handles empty alternatives", () => {
  const q = { ...makeQ(0), alternatives: [] };
  const s = shuffleQuestion(q);
  expect(s.alternatives).toEqual([]);
  expect(s.correct).toBe(0);
});
