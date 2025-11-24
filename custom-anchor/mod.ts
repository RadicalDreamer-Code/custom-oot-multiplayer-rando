import { encodeHex } from "https://deno.land/std@0.208.0/encoding/hex.ts";
import { readLines } from "https://deno.land/std@0.208.0/io/read_lines.ts";
import { writeAll } from "https://deno.land/std@0.208.0/streams/write_all.ts";
import { importantItem, ItemID } from "./gameId.ts";
import { PlayerData, QuizManager } from "./questionGame/quizManager.ts";

// TODO: make nicer later
let currentMaxHealth: number = -1;

const decoder = new TextDecoder();
const encoder = new TextEncoder();

type ClientData = Record<string, any>;

interface BasePacket {
  clientId?: number;
  roomId?: string;
  quiet?: boolean;
  targetClientId?: number;
}

interface UpdateClientDataPacket extends BasePacket {
  type: "UPDATE_CLIENT_DATA";
  data: ClientData;
}

interface AllClientDataPacket extends BasePacket {
  type: "ALL_CLIENT_DATA";
  clients: ClientData[];
}

interface ServerMessagePacket extends BasePacket {
  type: "SERVER_MESSAGE";
  message: string;
}

interface DisableAnchorPacket extends BasePacket {
  type: "DISABLE_ANCHOR";
}

interface DecreaseHealthPacket extends BasePacket {
  type: "DECREASE_HEALTH";
}

interface IncreaseHealthPacket extends BasePacket {
  type: "INCREASE_HEALTH";
}

interface SignalPunishmentPacket extends BasePacket {
  type: "SIGNAL_PUNISHMENT";
  data: string;
}

interface QuestionsPacket extends BasePacket {
  type: "RECEIVE_QUESTIONS";
  message: string;
}

interface CheckTrackerData {
  hintItem: number;
  price: number;
  skipped: number;
  status: number;
}

interface SceneFlag {
  chest: number;
  clear: number;
  collect: number;
  swch: number;
}

interface Inventory {
  ammo: number[];
  defenseHearts: number;
  dungeonItems: number[];
  dungeonKeys: number[];
  equipment: number;
  gsTokens: number;
  items: number[];
  questItems: number;
  upgrades: number;
}

interface SohStats {
  entrancesDiscovered: number[];
  fileCreatedAt: number;
}

interface PushSaveStatePacket extends BasePacket {
  type: "PUSH_SAVE_STATE";
  adultTradeItems: number;
  bgsFlag: number;
  checkTrackerData: CheckTrackerData[];
  eventChkInf: number[];
  gsFlags: number[];
  healthCapacity: number;
  infTable: number[];
  inventory: Inventory;
  isDoubleDefenseAcquired: number;
  isDoubleMagicAcquired: number;
  isMagicAcquired: number;
  itemGetInf: number[];
  magicCapacity: number;
  magicLevel: number;
  randomizerInf: number[];
  sceneFlags: SceneFlag[];
  sohStats: SohStats;
  swordHealth: number;
  triforcePiecesCollected: number;
}

interface OtherPackets extends BasePacket {
  type: "REQUEST_SAVE_STATE" | "GAME_COMPLETE" | "HEARTBEAT";
}

type Packet =
  | UpdateClientDataPacket
  | DisableAnchorPacket
  | DecreaseHealthPacket
  | IncreaseHealthPacket
  | ServerMessagePacket
  | AllClientDataPacket
  | PushSaveStatePacket
  | QuestionsPacket
  | SignalPunishmentPacket
  | OtherPackets;

interface ServerStats {
  lastStatsHeartbeat: number;
  clientSHAs: Record<string, boolean>;
  onlineCount: number;
  gamesCompleted: number;
  pid: number;
}

let currentTime: string = "";
function getCurrentDateTime() {
  const now = new Date();

  // Format each part with leading zeros if necessary
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getCurrentTime() {
  const now = new Date();

  // Format each part with leading zeros if necessary
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
}

// Create a function to create a new file and write initial content
async function createFile(filename: string, initialContent: string = "") {
  try {
    await Deno.writeTextFile(filename, initialContent);
    console.log(`File '${filename}' created successfully!`);
  } catch (error) {
    console.error("Error creating file:", error);
  }
}
// Function to append content to an existing file
async function appendToFile(filename: string, content: string) {
  try {
    await Deno.writeTextFile(filename, content, { append: true });
    console.log(`Content appended to '${filename}'!`);
  } catch (error) {
    console.error("Error appending to file:", error);
  }
}

const port =
  Deno.env.has("PORT") && !isNaN(parseInt(Deno.env.get("PORT")!, 10))
    ? parseInt(Deno.env.get("PORT")!, 10)
    : 43385;
// let quietMode = !!Deno.env.has("QUIET");
let quietMode = false;

class Server {
  private listener?: Deno.Listener;
  public clients: Client[] = [];
  public rooms: Room[] = [];
  public stats: ServerStats = {
    lastStatsHeartbeat: Date.now(),
    clientSHAs: {},
    onlineCount: 0,
    gamesCompleted: 0,
    pid: Deno.pid,
  };

  async start() {
    await this.parseStats();

    this.statsHeartbeat();
    this.clientHeartbeat();

    this.startServer();
  }

  async parseStats() {
    try {
      const statsString = await Deno.readTextFile("./stats.json");
      this.stats = Object.assign(this.stats, JSON.parse(statsString));
      this.stats.pid = Deno.pid;
      this.log("Loaded stats file");
    } catch (_) {
      this.log("No stats file found");
    }
  }

  async statsHeartbeat() {
    try {
      this.stats.lastStatsHeartbeat = Date.now();
      this.stats.onlineCount = this.clients.length;

      await this.saveStats();
    } catch (error) {
      this.log(`Error saving stats: ${error.message}`);
    }

    setTimeout(() => {
      this.statsHeartbeat();
    }, 2500);
  }

  async clientHeartbeat() {
    try {
      await Promise.all(
        server.clients.map((client) => {
          return client
            .sendPacket({
              type: "HEARTBEAT",
            })
            .catch((_) => {}); // Ignore errors, client will disconnect if it's a problem
        })
      );
    } catch (error) {
      this.log(`Error sending heartbeat to clients: ${error.message}`);
    }

    setTimeout(() => {
      this.clientHeartbeat();
    }, 1000 * 3);
  }

  async saveStats() {
    try {
      await Deno.writeTextFile(
        "./stats.json",
        JSON.stringify(this.stats, null, 4)
      );
    } catch (error) {
      this.log(`Error saving stats: ${error.message}`);
    }
  }

  async startServer() {
    this.listener = Deno.listen({ port });
    console.log(getCurrentDateTime());
    currentTime = getCurrentTime();

    this.log(`Server Started on port ${port}`);
    // var datestring = getCurrentTime();
    await createFile(currentTime + ".txt", "Initial content.\n");
    try {
      for await (const connection of this.listener) {
        try {
          const client = new Client(connection, this);
          this.clients.push(client);
        } catch (error) {
          this.log(`Error connecting client: ${error.message}`);
        }
      }
    } catch (error) {
      this.log(`Error starting server: ${error.message}`);
    }
  }

  removeClient(client: Client) {
    const index = this.clients.indexOf(client);
    if (index !== -1) {
      this.clients.splice(index, 1);
    }
  }

  getOrCreateRoom(id: string) {
    const room = this.rooms.find((room) => room.id === id);
    if (room) {
      return room;
    }

    const newRoom = new Room(id, this);
    this.rooms.push(newRoom);
    return newRoom;
  }

  removeRoom(room: Room) {
    const index = this.rooms.indexOf(room);
    if (index !== -1) {
      this.rooms.splice(index, 1);
    }
  }

  log(...data: any[]) {
    console.log(`[Server]:`, ...data);
  }
}

class Client {
  public id: number;
  public data: ClientData = {};
  public connection: Deno.Conn;
  public server: Server;
  public room?: Room;

  constructor(connection: Deno.Conn, server: Server) {
    this.connection = connection;
    this.server = server;
    this.id = connection.rid;

    // SHA256 to get a rough idea of how many unique players there are
    crypto.subtle
      .digest(
        "SHA-256",
        encoder.encode((this.connection.remoteAddr as Deno.NetAddr).hostname)
      )
      .then((hasBuffer) => {
        this.server.stats.onlineCount++;
        this.server.stats.clientSHAs[encodeHex(hasBuffer)] = true;
      })
      .catch((error) => {
        this.log(`Error hashing client: ${error.message}`);
      });

    this.waitForData();
    this.log("Connected");
  }

  async waitForData() {
    const buffer = new Uint8Array(1024);
    let data = new Uint8Array(0);

    while (true) {
      let count: null | number = 0;

      try {
        count = await this.connection.read(buffer);
      } catch (error) {
        this.log(`Error reading from connection: ${error.message}`);
        console.log("Error reading from connection: ", error);
        this.disconnect();
        break;
      }

      if (!count) {
        console.log("No data, disconnecting");
        this.disconnect();
        break;
      }

      // Concatenate received data with the existing data
      const receivedData = buffer.subarray(0, count);
      data = concatUint8Arrays(data, receivedData);

      // Handle all complete packets (while loop in case multiple packets were received at once)
      while (true) {
        const delimiterIndex = findDelimiterIndex(data);
        if (delimiterIndex === -1) {
          break; // Incomplete packet, wait for more data
        }

        // Extract the packet
        const packet = data.subarray(0, delimiterIndex);
        data = data.subarray(delimiterIndex + 1);

        this.handlePacket(packet);
      }
    }
  }

  handlePacket(packet: Uint8Array) {
    try {
      const packetString = decoder.decode(packet);
      const packetObject: Packet = JSON.parse(packetString);
      // console.log("Received packet:", packetObject);
      packetObject.clientId = this.id;

      if (!packetObject.quiet && !quietMode) {
        this.log(`-> ${packetObject.type} packet`);
      }

      if (packetObject.type === "GIVE_ITEM") {
        console.log("ITTEEEEM");
      }

      if (packetObject.type === "CLIENT_UPDATE") {
        // console.log("CLIENT_UPDATE packet received");
      }

      if (packetObject.type === "UPDATE_CLIENT_DATA") {
        this.data = packetObject.data;
        console.log(`Client ${this.id} data updated:`, this.data);
      }

      if (packetObject.type === "GAME_COMPLETE") {
        this.server.stats.gamesCompleted++;
      }

      if (packetObject.roomId && !this.room) {
        this.server.getOrCreateRoom(packetObject.roomId).addClient(this);
      }

      if (!this.room) {
        this.log("Not in a room, ignoring packet");
        return;
      }

      if (packetObject.type === "SIGNAL_PUNISHMENT") {
        console.log("SIGNAL_PUNISHMENT packet received");
        console.log(packetObject);
        this.room.broadcastPacket(packetObject, this);
      }

      if (packetObject.targetClientId) {
        const targetClient = this.room.clients.find(
          (client) => client.id === packetObject.targetClientId
        );
        if (targetClient) {
          targetClient.sendPacket(packetObject);
        } else {
          this.log(`Target client ${packetObject.targetClientId} not found`);
        }
        return;
      }

      if (packetObject.type === "REQUEST_SAVE_STATE") {
        if (this.room.clients.length > 1) {
          this.room.requestingStateClients.push(this);
          this.room.broadcastPacket(packetObject, this);
        }
      } else if (packetObject.type === "PUSH_SAVE_STATE") {
        console.log("PUSH_SAVE_STATE packet received");
        console.log(packetObject);
        const roomStateRequests = this.room.requestingStateClients;
        roomStateRequests.forEach((client) => {
          client.sendPacket(packetObject);
        });
        this.room.requestingStateClients = [];
      } else {
        this.room.broadcastPacket(packetObject, this);
      }
    } catch (error) {
      this.log(`Error handling packet: ${error.message}`);
    }
  }

  async sendPacket(packetObject: Packet) {
    try {
      if (!packetObject.quiet && !quietMode) {
        this.log(`<- ${packetObject.type} packet`);
      }
      const packetString = JSON.stringify(packetObject);
      const packet = encoder.encode(packetString + "\0");

      // Wait for writeAll to complete, if it takes longer than 30 seconds, disconnect
      await Promise.race([
        writeAll(this.connection, packet),
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("Timeout, took longer than 30 seconds to send"));
          }, 1000 * 30);
        }),
      ]);
    } catch (error) {
      this.log(`Error sending packet: ${error.message}`);
      console.log("Error sending packet: ", error);
      this.disconnect();
    }
  }

  disconnect() {
    try {
      if (this.room) {
        this.room.removeClient(this);
      }
      this.server.removeClient(this);
      this.connection.close();
    } catch (error) {
      this.log(`Error disconnecting: ${error.message}`);
    } finally {
      this.server.stats.onlineCount--;
      this.log("Disconnected");
    }
  }

  log(message: string) {
    console.log(`[Client ${this.id}]: ${message}`);
  }
}

function getItemByKey<T>(key: string, obj: Record<string, T>): T | undefined {
  return obj[key];
}

class Room {
  public id: string;
  public server: Server;
  public clients: Client[] = [];
  public requestingStateClients: Client[] = [];

  constructor(id: string, server: Server) {
    this.id = id;
    this.server = server;
    this.log("Created");
  }

  addClient(client: Client) {
    this.log(`Adding client ${client.id}`);
    this.clients.push(client);
    client.room = this;

    this.broadcastAllClientData();

    // Send questions to the newly connected client
    sendQuestions(client);
  }

  removeClient(client: Client) {
    this.log(`Removing client ${client.id}`);
    const index = this.clients.indexOf(client);
    if (index !== -1) {
      this.clients.splice(index, 1);
      client.room = undefined;
    }

    if (this.clients.length) {
      this.broadcastAllClientData();
    } else {
      this.log("No clients left, removing room");
      this.server.removeRoom(this);
    }
  }

  broadcastAllClientData() {
    if (!quietMode) {
      this.log("<- ALL_CLIENT_DATA packet");
    }
    for (const client of this.clients) {
      const packetObject = {
        type: "ALL_CLIENT_DATA" as const,
        roomId: this.id,
        clients: this.clients
          .filter((c) => c !== client)
          .map((c) => ({
            clientId: c.id,
            ...c.data,
          })),
      };

      client.sendPacket(packetObject);
      console.log(packetObject);
    }
  }

  broadcastPacket(packetObject: Packet, sender: Client) {
    if (!packetObject.quiet && !quietMode) {
      this.log(`<- ${packetObject.type} packet from ${sender.id}`);
    }
    //TODO: Add more packet types
    if (packetObject.type === "GIVE_ITEM") {
      console.log("GIVE_ITEM", packetObject);
      // setColor("0000FF")
      //   .then((response) => {
      //     console.log("LEDs set to blue:", response);
      //   })
      //   .catch((error) => {
      //     console.error("Error:", error);
      //   });

      //
      var valueToCheck = packetObject.getItemId;
      if (importantItem.includes(valueToCheck as ItemID)) {
        console.log("Value is in the importantItem array.");
        var newContent =
          getCurrentDateTime() +
          " - " +
          packetObject.getItemId +
          " was found by " +
          sender.id +
          "\n";
        appendToFile(currentTime + ".txt", newContent);
      } else {
        console.log("Value is not in the importantItem array.");
      }

      // wipeColor("00FF00", 100)
      //   .then((response) => {
      //     console.log("Green wipe complete:", response);
      //   })
      //   .catch((error) => {
      //     console.error("Error:", error);
      //   });
    }

    for (const client of this.clients) {
      if (client !== sender) {
        client.sendPacket(packetObject);
      }
    }
  }

  log(message: string) {
    console.log(`[Room ${this.id}]: ${message}`);
  }
}

function concatUint8Arrays(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(a.length + b.length);
  result.set(a, 0);
  result.set(b, a.length);
  return result;
}

function findDelimiterIndex(data: Uint8Array): number {
  for (let i = 0; i < data.length; i++) {
    if (data[i] === 0 /* null terminator */) {
      return i;
    }
  }
  return -1;
}

// Question Game
const manager = new QuizManager();
let quizAssignments = new Map<string, any>();

async function loadShuffledQuestions() {
  try {
    // Get the current date to find today's quiz file
    const now = new Date();
    const dateString = now.toISOString().split("T")[0];
    const filename = `quiz-${dateString}.json`;
    const filePath = `./questionGame/${filename}`;

    console.log(`Loading shuffled questions from ${filename}...`);
    const content = await Deno.readTextFile(filePath);
    const quizData = JSON.parse(content);

    // Convert to Map for easy lookup
    quizAssignments.clear();
    for (const [playerName, playerData] of Object.entries(quizData)) {
      quizAssignments.set(playerName, playerData);
    }

    console.log(
      `Loaded question assignments for ${quizAssignments.size} players:`,
      Array.from(quizAssignments.keys()).join(", ")
    );
  } catch (error) {
    console.error(`Error loading shuffled questions: ${error.message}`);
    throw error;
  }
}

// // Load existing player files on startup (for backward compatibility)
// await manager.loadAllPlayerFiles("./questionGame");

// // Assign 10 unique questions to each of 2 players
// // Each question will only be used once
// const assignments = manager.assignRandomQuestions(
//   ["player-1", "player-2"],
//   10,
//   false // no duplicates
// );

// Server
const server = new Server();
server.start().catch((error) => {
  console.error("Error starting server: ", error);
  Deno.exit(1);
});

globalThis.addEventListener("unhandledrejection", (e) => {
  console.error("Unhandled rejection at:", e.promise, "reason:", e.reason);
  e.preventDefault();
  Deno.exit(1);
});

// Enable raw mode for key input detection
function enableRawMode() {
  if (Deno.stdin.setRaw) {
    Deno.stdin.setRaw(true);
  }
}

// Key input listener for single key presses
async function setupKeyListener() {
  console.log(
    "Key listener active. Press 'e' for emergency broadcast, 'r' for DECREASE_HEALTH packet, 't' for INCREASE_HEALTH packet, 'i' to send questions, 'l' to load shuffled questions, 'f' to fetch questions from API, 'q' to quit, or any other key for help."
  );

  const buffer = new Uint8Array(1);

  while (true) {
    try {
      const bytesRead = await Deno.stdin.read(buffer);
      if (bytesRead === null) break;

      const key = String.fromCharCode(buffer[0]);

      switch (key.toLowerCase()) {
        case "e": {
          // Broadcast emergency/event message
          const emergencyMessage = `[EMERGENCY BROADCAST] Server alert triggered at ${getCurrentDateTime()}`;
          console.log(`\nBroadcasting: ${emergencyMessage}`);

          for (const client of server.clients) {
            sendServerMessage(client, emergencyMessage);
          }
          console.log(`Message sent to ${server.clients.length} clients`);
          break;
        }
        case "r": {
          // Send DECREASE_HEALTH packet to all clients
          console.log(`\nSending DECREASE_HEALTH packet to all clients...`);

          for (const client of server.clients) {
            sendDecreaseHealth(client);
          }
          console.log(
            `DECREASE_HEALTH packet sent to ${server.clients.length} clients`
          );
          break;
        }
        case "t": {
          console.log(`\nSending DECREASE_HEALTH packet to all clients...`);

          for (const client of server.clients) {
            sendIncreaseHealth(client);
          }
          console.log(
            `INCREASE_HEALTH packet sent to ${server.clients.length} clients`
          );
          break;
        }
        case "i": {
          console.log(`\nSending questions to all clients...`);

          for (const client of server.clients) {
            sendQuestions(client);
          }
          console.log(`Questions sent to ${server.clients.length} clients`);
          break;
        }
        case "l": {
          console.log(`\nLoading shuffled questions file...`);
          try {
            await loadShuffledQuestions();
            console.log(`Successfully loaded shuffled questions!`);
          } catch (error) {
            console.error(
              `Failed to load shuffled questions: ${error.message}`
            );
          }
          break;
        }
        case "f": {
          console.log(`\nFetching questions from API...`);
          try {
            await manager.requestAllPlayerQuestions(
              "oot",
              "dezrando",
              "admin123"
            );
            await loadShuffledQuestions();
            console.log(`Successfully fetched and loaded questions!`);
          } catch (error) {
            console.error(`Failed to fetch questions: ${error.message}`);
          }
          break;
        }
        case "q": {
          console.log("\nExiting key listener mode...");
          if (Deno.stdin.setRaw) {
            Deno.stdin.setRaw(false);
          }
          return;
        }
        case "\r":
        case "\n": {
          // Ignore enter keys
          break;
        }
        default: {
          console.log(`\nKey pressed: '${key}' (${buffer[0]})`);
          console.log("Available key commands:");
          console.log(
            "  'e' - Send emergency broadcast message to all clients"
          );
          console.log("  'r' - Send DECREASE_HEALTH packet to all clients");
          console.log("  't' - Send INCREASE_HEALTH packet to all clients");
          console.log("  'i' - Send questions to all clients");
          console.log(
            "  'l' - Load shuffled questions from quiz-YYYY-MM-DD.json"
          );
          console.log("  'f' - Fetch questions from API and assign them");
          console.log("  'q' - Quit key listener mode");
          console.log("  'f' - Fetch questions from API and assign them");
          console.log("  'q' - Quit key listener mode");
          break;
        }
      }
    } catch (error) {
      console.error("Error reading key input:", error);
      break;
    }
  }

  // Restore normal mode
  if (Deno.stdin.setRaw) {
    Deno.stdin.setRaw(false);
  }
}

function sendServerMessage(client: Client, message: string) {
  return client.sendPacket({
    type: "SERVER_MESSAGE",
    message,
  });
}

function sendDecreaseHealth(client: Client) {
  return client.sendPacket({
    type: "DECREASE_HEALTH",
  });
}

function sendIncreaseHealth(client: Client) {
  return client.sendPacket({
    type: "INCREASE_HEALTH",
  });
}

function sendQuestions(client: Client) {
  // Get the player name from client data
  const playerName = client.data.name || client.data.playerName;

  if (!playerName) {
    console.log(`Client ${client.id} has no name, cannot assign questions`);
    return client.sendPacket({
      type: "RECEIVE_QUESTIONS",
      message: JSON.stringify({ questionGame: { questions: [] } }),
    });
  }

  // Check if we have shuffled assignments loaded
  if (quizAssignments.size > 0 && quizAssignments.has(playerName)) {
    const playerData = quizAssignments.get(playerName);
    console.log(
      `Sending ${playerData.questionGame.questions.length} shuffled questions to ${playerName} (client ${client.id})`
    );
    return client.sendPacket({
      type: "RECEIVE_QUESTIONS",
      message: JSON.stringify(playerData),
    });
  }

  // Fallback to old method
  const questions = assignments.get("player-1")?.map((q) => q.question) || [];
  const playerData: PlayerData = {
    questionGame: {
      questions: assignments.get("player-1") || [],
    },
  };
  console.log(
    `Sending fallback questions to ${playerName || "unknown"} (client ${
      client.id
    })`
  );
  return client.sendPacket({
    type: "RECEIVE_QUESTIONS",
    message: JSON.stringify(playerData),
  });
}

function sendDisable(client: Client, message: string) {
  sendServerMessage(client, message).finally(() =>
    client.sendPacket({
      type: "DISABLE_ANCHOR",
    })
  );
}

async function stop(message = "Server restarting") {
  await Promise.all(
    server.clients.map((client) =>
      sendServerMessage(client, message).finally(() => {
        client.disconnect();
      })
    )
  );

  Deno.exit();
}

(async function processStdin() {
  try {
    for await (const line of readLines(Deno.stdin)) {
      const [command, ...args] = line.split(" ");

      switch (command) {
        default:
        case "help": {
          console.log(
            `Available commands:
  help: Show this help message
  stats: Print server stats
  quiet: Toggle quiet mode
  roomCount: Show the number of rooms
  clientCount: Show the number of clients
  list: List all rooms and clients
  keys: Enable key listener mode (press 'e' for emergency broadcast)
  stop <message>: Stop the server
  message <clientId> <message>: Send a message to a client
  messageAll <message>: Send a message to all clients
  disable <clientId> <message>: Disable anchor on a client
  disableAll <message>: Disable anchor on all clients`
          );
          break;
        }
        case "keys": {
          console.log("Starting key listener mode...");
          enableRawMode();
          await setupKeyListener();
          break;
        }
        case "roomCount": {
          console.log(`Room count: ${server.rooms.length}`);
          break;
        }
        case "clientCount": {
          console.log(`Client count: ${server.clients.length}`);
          break;
        }
        case "quiet": {
          quietMode = !quietMode;
          console.log(`Quiet mode: ${quietMode}`);
          break;
        }
        case "stats": {
          const { clientSHAs: _, ...stats } = server.stats;
          console.log(stats);
          break;
        }
        case "list": {
          for (const room of server.rooms) {
            console.log(`Room ${room.id}:`);
            for (const client of room.clients) {
              console.log(
                `  Client ${client.id}: ${JSON.stringify(client.data)}`
              );
            }
          }
          break;
        }
        case "disable": {
          const [clientId, ...messageParts] = args;
          const message = messageParts.join(" ");
          const client = server.clients.find(
            (c) => c.id === parseInt(clientId, 10)
          );
          if (client) {
            sendDisable(client, message);
          } else {
            console.log(`Client ${clientId} not found`);
          }
          break;
        }
        case "disableAll": {
          const message = args.join(" ");
          for (const client of server.clients) {
            sendDisable(client, message);
          }
          break;
        }
        case "message": {
          const [clientId, ...messageParts] = args;
          const message = messageParts.join(" ");
          const client = server.clients.find(
            (c) => c.id === parseInt(clientId, 10)
          );
          if (client) {
            sendServerMessage(client, message);
          } else {
            console.log(`Client ${clientId} not found`);
          }
          break;
        }
        case "messageAll": {
          const message = args.join(" ");
          for (const client of server.clients) {
            sendServerMessage(client, message);
          }
          break;
        }
        case "stop": {
          const message = args.join(" ");
          stop(message);
          break;
        }
      }
    }
  } catch (error) {
    console.error("Error reading from stdin: ", error.message);
    processStdin();
  }
})();
