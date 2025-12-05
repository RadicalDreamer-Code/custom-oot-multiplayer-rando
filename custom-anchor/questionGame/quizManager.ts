import { join } from "https://deno.land/std@0.208.0/path/mod.ts";

interface Answer {
  text: string;
  isCorrect: boolean;
}

interface ApiQuestion {
  id: string;
  questionText: string;
  answers: Answer[];
  difficulty: string;
  createdBy: string;
  createdAt: string;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  difficulty: string;
  answerId: number;
  createdBy?: string;
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

          // Shuffle options and update answerId accordingly
          const correctOption = uniqueQuestion.options[uniqueQuestion.answerId];
          const shuffledOptions = this.shuffle(uniqueQuestion.options);
          uniqueQuestion.options = shuffledOptions;
          for (let i = 0; i < shuffledOptions.length; i++) {
            if (correctOption == shuffledOptions[i]) {
              uniqueQuestion.answerId = i;
              break;
            }
          }

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

  async requestAllPlayerQuestions(
    username: string,
    password: string,
    adminPassword: string
  ): Promise<void> {
    console.log("Sending request with credentials for user:", username);

    // Encode credentials for Basic Auth
    const credentials = btoa(`${username}:${password}`);

    const response = await fetch(
      "https://www.radicaldreamer.de/api/admin/questions",
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          "x-admin-password": adminPassword,
        },
      }
    );

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`Failed to fetch questions: ${response.statusText}`);
    }

    const apiQuestions: ApiQuestion[] = await response.json();
    console.log(`Fetched ${apiQuestions.length} questions from API`);

    // Filter by players
    const selectedPlayers = ["Player1", "Player2", "Player3", "LongShotEnjoyer"]
    // TODO: FIlter apiQuestions by these selectedPlayers
    const filteredApiQuestions = apiQuestions.filter((x) => selectedPlayers.includes(x.createdBy));

    console.log(filteredApiQuestions);

    // Group questions by creator
    const questionsByCreator = new Map<string, ApiQuestion[]>();
    for (const apiQ of filteredApiQuestions) {
      const creator = apiQ.createdBy;
      if (!questionsByCreator.has(creator)) {
        questionsByCreator.set(creator, []);
      }
      questionsByCreator.get(creator)!.push(apiQ);
    }

    const creators = Array.from(questionsByCreator.keys());
    console.log(`Found questions from ${creators.length} creators:`, creators);

    // Assign questions to players (each player gets questions NOT created by them,
// no question is assigned twice, and questions are balanced per difficulty)
const assignments = new Map<string, Question[]>();

// Hilfsfunktion für Difficulty-Ranking (falls string-basiert)
const difficultyRank = (d: string | number): number => {
  if (typeof d === "number") return d;

  const order = ["Easy", "Medium", "Difficult"];
  const idx = order.indexOf(d.toUpperCase());
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
};

// Typ für API-Fragen
type ApiQuestion = {
  questionText: string;
  answers: { text: string; isCorrect: boolean }[];
  createdBy: string;
  difficulty: string | number;
};

// 1. Alle Fragen flatten
const allApiQuestions: ApiQuestion[] = [];

for (const [creator, creatorQuestions] of questionsByCreator.entries()) {
  for (const apiQ of creatorQuestions) {
    allApiQuestions.push(apiQ);
  }
}

// Alle vorkommenden Schwierigkeitsgrade bestimmen
const difficulties = Array.from(
  new Set(allApiQuestions.map((q) => q.difficulty))
);

// Zwischen-Speicher für Zuweisungen (noch ohne ID)
const tempAssignments = new Map<string, Question[]>();
for (const player of creators) {
  tempAssignments.set(player, []);
}

// 2. Pro Schwierigkeitsgrad gleichmäßig auf Spieler verteilen
for (const difficulty of difficulties) {
  const questionsOfDifficulty = allApiQuestions.filter(
    (q) => q.difficulty === difficulty
  );

  // Fragen dieses Schwierigkeitsgrads mischen
  const shuffledQuestions = this.shuffle([...questionsOfDifficulty]);

  const total = shuffledQuestions.length;
  const numPlayers = creators.length;

  // Ziel-Anzahl pro Spieler für diesen Schwierigkeitsgrad
  const base = Math.floor(total / numPlayers);
  const remainder = total % numPlayers;

  const targetPerPlayer = new Map<string, number>();
  creators.forEach((player, index) => {
    // Die ersten `remainder` Spieler bekommen eine Frage mehr
    targetPerPlayer.set(player, base + (index < remainder ? 1 : 0));
  });

  const assignedCount = new Map<string, number>();
  creators.forEach((player) => assignedCount.set(player, 0));

  for (const apiQ of shuffledQuestions) {
    // Spielerreihenfolge für diese Frage mischen, damit es fair bleibt
    const shuffledPlayers = this.shuffle([...creators]);
    let assigned = false;

    for (const player of shuffledPlayers) {
      if (player === apiQ.createdBy) continue; // keine eigenen Fragen

      const current = assignedCount.get(player)!;
      const target = targetPerPlayer.get(player)!;

      if (current >= target) continue;

      const correctAnswerIndex = apiQ.answers.findIndex((a) => a.isCorrect);

      const question: Question = {
        // ID setzen wir später nach der finalen Sortierung
        id: 0,
        question: apiQ.questionText,
        options: apiQ.answers.map((a) => a.text),
        answerId: correctAnswerIndex !== -1 ? correctAnswerIndex : 0,
        createdBy: apiQ.createdBy,
        // NEU: Difficulty mitnehmen
        difficulty: apiQ.difficulty as any,
      };

      // Shuffle options and update answerId accordingly
          const correctOption = question.options[question.answerId];
          const shuffledOptions = this.shuffle(question.options);
          question.options = shuffledOptions;
          for (let i = 0; i < shuffledOptions.length; i++) {
            if (correctOption == shuffledOptions[i]) {
              question.answerId = i;
              break;
            }
      }

      tempAssignments.get(player)!.push(question);
      assignedCount.set(player, current + 1);
      assigned = true;
      break;
    }

    if (!assigned) {
      // Kann passieren, wenn z.B. alle Fragen von einem einzigen Creator kommen
      // und dieser Creator nach der Zielverteilung mehr Fragen bekommen soll,
      // seine eigenen aber nicht kriegen darf.
      console.warn(
        `Could not assign question "${apiQ.questionText}" for difficulty ${String(
          difficulty
        )}`
      );
    }
  }
}

// 3. Für jeden Spieler: Fragen nach Schwierigkeit gruppieren,
//    innerhalb der Difficulty shufflen, Difficulties sortieren,
//    IDs neu durchzählen.
for (const player of creators) {
  const playerQuestions = tempAssignments.get(player)!;

  const byDifficulty = new Map<string | number, Question[]>();
  for (const q of playerQuestions) {
    const key = q.difficulty;
    const list = byDifficulty.get(key) ?? [];
    list.push(q);
    byDifficulty.set(key, list);
  }

  // Schwierigkeitsgrade sortieren (easy -> medium -> hard oder numerisch)
  const sortedDifficulties = Array.from(byDifficulty.keys()).sort(
    (a, b) => difficultyRank(a) - difficultyRank(b)
  );

  const finalQuestions: Question[] = [];
  for (const diff of sortedDifficulties) {
    const group = byDifficulty.get(diff)!;
    const shuffledGroup = this.shuffle(group); // innerhalb der Schwierigkeit mischen
    finalQuestions.push(...shuffledGroup);
  }

  // IDs pro Spieler neu setzen
  finalQuestions.forEach((q, index) => {
    q.id = index + 1;
  });

  assignments.set(player, finalQuestions);
  console.log(`Assigned ${finalQuestions.length} questions to ${player}`);
}

    // Save all assignments to a single file with current date
    const now = new Date();
    const dateString = now.toISOString().split("T")[0]; // YYYY-MM-DD format
    const filename = `quiz-${dateString}.json`;

    // Create directory if it doesn't exist
    try {
      await Deno.mkdir("./questionGame", { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    const filePath = join("./questionGame", filename);

    // Convert Map to a plain object for JSON serialization
    const quizData: Record<string, PlayerData> = {};
    for (const [player, questions] of assignments) {
      quizData[player] = {
        questionGame: {
          questions: questions,
        },
      };
    }

    await Deno.writeTextFile(filePath, JSON.stringify(quizData, null, 2));
    console.log(`Saved all question assignments to ${filename}`);
    console.log(
      `File contains assignments for: ${Array.from(assignments.keys()).join(
        ", "
      )}`
    );
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

    // if (!allowDuplicates && totalQuestionsNeeded > this.questionPool.length) {
    //   throw new Error(
    //     `Not enough questions in pool. Need ${totalQuestionsNeeded} but only have ${this.questionPool.length}`
    //   );
    // }

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
          difficulty: q.difficulty,
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

  // Fetch questions from API and assign them
  const username = "oot";
  const password = "dezrando";
  const adminPassword = "admin123";
  await manager.requestAllPlayerQuestions(username, password, adminPassword);

  console.log("\nQuestion assignments have been saved to player JSON files!");
}
