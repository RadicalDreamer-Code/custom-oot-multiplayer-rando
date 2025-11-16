import { QuizManager } from "./quizManager.ts";

/**
 * Example 1: Load all questions and view statistics
 */
async function example1() {
  console.log("=== Example 1: Load and View Statistics ===\n");

  const manager = new QuizManager();

  // Load all player JSON files
  await manager.loadAllPlayerFiles("./questionGame");

  // Print statistics about the question pool
  manager.printStats();
}

/**
 * Example 2: Assign random questions with duplicates allowed
 */
async function example2() {
  console.log("\n=== Example 2: Assign Questions (with duplicates) ===\n");

  const manager = new QuizManager();
  await manager.loadAllPlayerFiles("./questionGame");

  // Assign 5 random questions to each of 4 players
  // Duplicates are allowed, so the same question can appear for multiple players
  const assignments = manager.assignRandomQuestions(
    ["player-A", "player-B", "player-C", "player-D"],
    5,
    true // allow duplicates
  );

  console.log("Question Assignments:");
  for (const [playerId, questions] of assignments) {
    console.log(`\n${playerId}:`);
    questions.forEach((q, i) => {
      console.log(`  ${i + 1}. ${q.question}`);
    });
  }
}

/**
 * Example 3: Assign unique questions (no duplicates)
 */
async function example3() {
  console.log("\n=== Example 3: Assign Unique Questions ===\n");

  const manager = new QuizManager();
  await manager.loadAllPlayerFiles("./questionGame");

  // Assign 5 unique questions to each of 2 players
  // Each question will only be used once
  const assignments = manager.assignRandomQuestions(
    ["player-1", "player-2"],
    5,
    false // no duplicates
  );

  console.log("Question Assignments:");
  for (const [playerId, questions] of assignments) {
    console.log(`\n${playerId}:`);
    questions.forEach((q, i) => {
      console.log(`  ${i + 1}. ${q.question}`);
    });
  }
}

/**
 * Example 4: Save assignments to new player files
 */
async function example4() {
  console.log("\n=== Example 4: Save Assignments to Files ===\n");

  const manager = new QuizManager();
  await manager.loadAllPlayerFiles("./questionGame");

  // Create assignments
  const assignments = manager.assignRandomQuestions(
    ["game-player-1", "game-player-2", "game-player-3"],
    7,
    true
  );

  // Save to files
  await manager.savePlayerAssignments(assignments, "./questionGame");

  console.log("\nAssignments saved to player files!");
}

/**
 * Example 5: Get all questions from the pool
 */
async function example5() {
  console.log("\n=== Example 5: Get All Questions ===\n");

  const manager = new QuizManager();
  await manager.loadAllPlayerFiles("./questionGame");

  const allQuestions = manager.getAllQuestions();

  console.log(`Total questions in pool: ${allQuestions.length}\n`);

  // Display first 3 questions
  console.log("First 3 questions:");
  allQuestions.slice(0, 3).forEach((q, i) => {
    console.log(`\n${i + 1}. ${q.question}`);
    q.options.forEach((opt, j) => {
      console.log(`   ${String.fromCharCode(65 + j)}) ${opt}`);
    });
    console.log(`   Correct answer: ${String.fromCharCode(65 + q.answerId)}`);
  });
}

// Run examples
if (import.meta.main) {
  // Run the example you want to test
  // Uncomment the one you want to run:

  await example1(); // Load and view statistics
  // await example2(); // Assign with duplicates
  // await example3(); // Assign without duplicates
  // await example4(); // Save assignments to files
  // await example5(); // Get all questions
}
