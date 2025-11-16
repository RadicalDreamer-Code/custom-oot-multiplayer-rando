import { join } from "https://deno.land/std@0.208.0/path/mod.ts";

interface Question {
  id: number;
  question: string;
  options: string[];
  answerId: number;
}

export interface PlayerData {
  questionGame: {
    questions: Question[];
  };
}

interface PlayerAssignment {
  playerId: string;
  questions: Question[];
}

export class QuizManager {
  private questionPool: Question[] = [];
  private playerFiles: Map<string, string> = new Map();

  /**
   * Load all player JSON files from the questionGame directory
   * @param dirPath Path to the questionGame directory
   */
  async loadAllPlayerFiles(dirPath: string = "./questionGame"): Promise<void> {
    try {
      const entries: Deno.DirEntry[] = [];
      for await (const entry of Deno.readDir(dirPath)) {
        entries.push(entry);
      }

      const playerFiles = entries
        .filter(
          (entry) =>
            entry.isFile &&
            entry.name.startsWith("player-") &&
            entry.name.endsWith(".json")
        )
        .map((entry) => entry.name);

      this.questionPool = [];
      this.playerFiles.clear();

      for (const file of playerFiles) {
        const filePath = join(dirPath, file);
        const content = await Deno.readTextFile(filePath);
        const data: PlayerData = JSON.parse(content);

        // Store the file path
        const playerId = file.replace(".json", "");
        this.playerFiles.set(playerId, filePath);

        // Add questions to the pool with source tracking
        for (const question of data.questionGame.questions) {
          // Create a unique ID based on source file and question id
          const uniqueQuestion = {
            ...question,
            sourceFile: playerId,
            originalId: question.id,
          };
          this.questionPool.push(uniqueQuestion);
        }
      }

      console.log(
        `Loaded ${this.questionPool.length} questions from ${playerFiles.length} player files`
      );
    } catch (error) {
      console.error("Error loading player files:", error);
      throw error;
    }
  }

  /**
   * Get the total number of questions in the pool
   */
  getQuestionPoolSize(): number {
    return this.questionPool.length;
  }

  /**
   * Get all questions in the pool
   */
  getAllQuestions(): Question[] {
    return [...this.questionPool];
  }

  /**
   * Shuffle an array using Fisher-Yates algorithm
   */
  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Assign random questions to each player
   * @param playerIds Array of player identifiers
   * @param questionsPerPlayer Number of questions to assign to each player
   * @param allowDuplicates Whether the same question can be assigned to multiple players
   * @returns Map of player IDs to their assigned questions
   */
  assignRandomQuestions(
    playerIds: string[],
    questionsPerPlayer: number,
    allowDuplicates: boolean = false
  ): Map<string, Question[]> {
    const assignments = new Map<string, Question[]>();

    if (this.questionPool.length === 0) {
      throw new Error("Question pool is empty. Load player files first.");
    }

    const totalQuestionsNeeded = allowDuplicates
      ? questionsPerPlayer * playerIds.length
      : questionsPerPlayer * playerIds.length;

    if (!allowDuplicates && totalQuestionsNeeded > this.questionPool.length) {
      throw new Error(
        `Not enough questions in pool. Need ${totalQuestionsNeeded} but only have ${this.questionPool.length}`
      );
    }

    if (allowDuplicates) {
      // Each player can get any question, duplicates allowed
      for (const playerId of playerIds) {
        const shuffled = this.shuffle(this.questionPool);
        const assigned = shuffled.slice(0, questionsPerPlayer);
        assignments.set(playerId, assigned);
      }
    } else {
      // No duplicates - each question used only once
      const shuffled = this.shuffle(this.questionPool);
      let offset = 0;

      for (const playerId of playerIds) {
        const assigned = shuffled.slice(offset, offset + questionsPerPlayer);
        assignments.set(playerId, assigned);
        offset += questionsPerPlayer;
      }
    }

    return assignments;
  }

  /**
   * Save assigned questions to player files
   * @param assignments Map of player IDs to their questions
   * @param outputDir Directory to save the files (default: questionGame)
   */
  async savePlayerAssignments(
    assignments: Map<string, Question[]>,
    outputDir: string = "./questionGame"
  ): Promise<void> {
    try {
      for (const [playerId, questions] of assignments) {
        // Renumber questions sequentially
        const renumberedQuestions = questions.map((q, index) => ({
          id: index + 1,
          question: q.question,
          options: q.options,
          answerId: q.answerId,
        }));

        const playerData: PlayerData = {
          questionGame: {
            questions: renumberedQuestions,
          },
        };

        const filePath = join(outputDir, `${playerId}.json`);
        await Deno.writeTextFile(filePath, JSON.stringify(playerData, null, 2));
        console.log(`Saved ${questions.length} questions to ${filePath}`);
      }
    } catch (error) {
      console.error("Error saving player assignments:", error);
      throw error;
    }
  }

  /**
   * Get statistics about the question pool
   */
  getPoolStats(): {
    totalQuestions: number;
    questionsBySource: Map<string, number>;
    averageOptionsPerQuestion: number;
  } {
    const questionsBySource = new Map<string, number>();

    for (const question of this.questionPool) {
      const source = (question as any).sourceFile || "unknown";
      questionsBySource.set(source, (questionsBySource.get(source) || 0) + 1);
    }

    const totalOptions = this.questionPool.reduce(
      (sum, q) => sum + q.options.length,
      0
    );
    const averageOptionsPerQuestion =
      this.questionPool.length > 0
        ? totalOptions / this.questionPool.length
        : 0;

    return {
      totalQuestions: this.questionPool.length,
      questionsBySource,
      averageOptionsPerQuestion,
    };
  }

  /**
   * Print pool statistics to console
   */
  printStats(): void {
    const stats = this.getPoolStats();
    console.log("\n=== Quiz Pool Statistics ===");
    console.log(`Total questions: ${stats.totalQuestions}`);
    console.log(
      `Average options per question: ${stats.averageOptionsPerQuestion.toFixed(
        1
      )}`
    );
    console.log("\nQuestions by source:");
    for (const [source, count] of stats.questionsBySource) {
      console.log(`  ${source}: ${count} questions`);
    }
    console.log("===========================\n");
  }
}

// Example usage
if (import.meta.main) {
  const manager = new QuizManager();

  // Load all player files
  await manager.loadAllPlayerFiles("./questionGame");

  // Print statistics
  manager.printStats();

  // Assign 5 random questions to 2 players (without duplicates)
  const assignments = manager.assignRandomQuestions(
    ["player-1", "player-2"],
    5,
    false
  );

  console.log("\n=== Question Assignments ===");
  for (const [playerId, questions] of assignments) {
    console.log(`\n${playerId}:`);
    questions.forEach((q, i) => {
      console.log(`  ${i + 1}. ${q.question}`);
    });
  }

  // Optionally save the assignments back to files
  // await manager.savePlayerAssignments(assignments);
}
