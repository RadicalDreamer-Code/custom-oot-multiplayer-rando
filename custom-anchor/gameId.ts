export enum ItemID {
  NONE = 0x00,
  BOMBS_5 = 0x01,
  NUTS_5 = 0x02,
  BOMBCHUS_10 = 0x03,
  BOW = 0x04,
  SLINGSHOT = 0x05,
  BOOMERANG = 0x06,
  STICKS_1 = 0x07,
  HOOKSHOT = 0x08,
  LONGSHOT = 0x09,
  LENS = 0x0a,
  LETTER_ZELDA = 0x0b,
  OCARINA_OOT = 0x0c,
  HAMMER = 0x0d,
  COJIRO = 0x0e,
  BOTTLE = 0x0f,
  POTION_RED = 0x10,
  POTION_GREEN = 0x11,
  POTION_BLUE = 0x12,
  FAIRY = 0x13,
  MILK_BOTTLE = 0x14,
  LETTER_RUTO = 0x15,
  BEAN = 0x16,
  MASK_SKULL = 0x17,
  MASK_SPOOKY = 0x18,
  CHICKEN = 0x19,
  MASK_KEATON = 0x1a,
  MASK_BUNNY = 0x1b,
  MASK_TRUTH = 0x1c,
  POCKET_EGG = 0x1d,
  POCKET_CUCCO = 0x1e,
  ODD_MUSHROOM = 0x1f,
  ODD_POTION = 0x20,
  SAW = 0x21,
  SWORD_BROKEN = 0x22,
  PRESCRIPTION = 0x23,
  FROG = 0x24,
  EYEDROPS = 0x25,
  CLAIM_CHECK = 0x26,
  SWORD_KOKIRI = 0x27,
  SWORD_KNIFE = 0x28,
  SHIELD_DEKU = 0x29,
  SHIELD_HYLIAN = 0x2a,
  SHIELD_MIRROR = 0x2b,
  TUNIC_GORON = 0x2c,
  TUNIC_ZORA = 0x2d,
  BOOTS_IRON = 0x2e,
  BOOTS_HOVER = 0x2f,
  QUIVER_40 = 0x30,
  QUIVER_50 = 0x31,
  BOMB_BAG_20 = 0x32,
  BOMB_BAG_30 = 0x33,
  BOMB_BAG_40 = 0x34,
  GAUNTLETS_SILVER = 0x35,
  GAUNTLETS_GOLD = 0x36,
  SCALE_SILVER = 0x37,
  SCALE_GOLD = 0x38,
  STONE_OF_AGONY = 0x39,
  GERUDO_CARD = 0x3a,
  OCARINA_FAIRY = 0x3b,
  SEEDS_5 = 0x3c,
  HEART_CONTAINER = 0x3d,
  HEART_PIECE = 0x3e,
  KEY_BOSS = 0x3f,
  COMPASS = 0x40,
  MAP = 0x41,
  KEY_SMALL = 0x42,
  MAGIC_SMALL = 0x43,
  MAGIC_LARGE = 0x44,
  WALLET_ADULT = 0x45,
  WALLET_GIANT = 0x46,
  WEIRD_EGG = 0x47,
  HEART = 0x48,
  ARROWS_SMALL = 0x49,
  ARROWS_MEDIUM = 0x4a,
  GI_ARROWS_LARGE = 0x4b,
  GI_RUPEE_GREEN = 0x4c,
  GI_RUPEE_BLUE = 0x4d,
  GI_RUPEE_RED = 0x4e,
  GI_HEART_CONTAINER_2 = 0x4f,
  GI_MILK = 0x50,
  GI_MASK_GORON = 0x51,
  GI_MASK_ZORA = 0x52,
  GI_MASK_GERUDO = 0x53,
  GI_BRACELET = 0x54,
  GI_RUPEE_PURPLE = 0x55,
  GI_RUPEE_GOLD = 0x56,
  GI_SWORD_BGS = 0x57,
  GI_ARROW_FIRE = 0x58,
  GI_ARROW_ICE = 0x59,
  GI_ARROW_LIGHT = 0x5a,
  GI_SKULL_TOKEN = 0x5b,
  GI_DINS_FIRE = 0x5c,
  GI_FARORES_WIND = 0x5d,
  GI_NAYRUS_LOVE = 0x5e,
  GI_BULLET_BAG_30 = 0x5f,
  GI_BULLET_BAG_40 = 0x60,
  GI_STICKS_5 = 0x61,
  GI_STICKS_10 = 0x62,
  GI_NUTS_5_2 = 0x63,
  GI_NUTS_10 = 0x64,
  GI_BOMBS_1 = 0x65,
  GI_BOMBS_10 = 0x66,
  GI_BOMBS_20 = 0x67,
  GI_BOMBS_30 = 0x68,
  GI_SEEDS_30 = 0x69,
  GI_BOMBCHUS_5 = 0x6a,
  GI_BOMBCHUS_20 = 0x6b,
  GI_FISH = 0x6c,
  GI_BUGS = 0x6d,
  GI_BLUE_FIRE = 0x6e,
  GI_POE = 0x6f,
  GI_BIG_POE = 0x70,
  GI_DOOR_KEY = 0x71,
  GI_RUPEE_GREEN_LOSE = 0x72,
  GI_RUPEE_BLUE_LOSE = 0x73,
  GI_RUPEE_RED_LOSE = 0x74,
  GI_RUPEE_PURPLE_LOSE = 0x75,
  GI_HEART_PIECE_WIN = 0x76,
  GI_STICK_UPGRADE_20 = 0x77,
  GI_STICK_UPGRADE_30 = 0x78,
  GI_NUT_UPGRADE_30 = 0x79,
  GI_NUT_UPGRADE_40 = 0x7a,
  GI_BULLET_BAG_50 = 0x7b,
  GI_ICE_TRAP = 0x7c,
  GI_TEXT_0 = 0x7d,
  GI_MAX = 0x84,
}

export function getEnumNameByValue(value: ItemID): string | undefined {
  return ItemID[value]; // TypeScript reverse mapping
}

export var importantItem: ItemID[] = [
  ItemID.NONE,
  // ItemID.BOMBS_5,
  // ItemID.NUTS_5,
  // ItemID.BOMBCHUS_10,
  ItemID.BOW,
  ItemID.SLINGSHOT,
  ItemID.BOOMERANG,
  // ItemID.STICKS_1,
  ItemID.HOOKSHOT,
  ItemID.LONGSHOT,
  ItemID.LENS,
  ItemID.LETTER_ZELDA,
  ItemID.OCARINA_OOT,
  ItemID.HAMMER,
  ItemID.COJIRO,
  ItemID.BOTTLE,
  ItemID.POTION_RED,
  ItemID.POTION_GREEN,
  ItemID.POTION_BLUE,
  ItemID.FAIRY,
  ItemID.MILK_BOTTLE,
  ItemID.LETTER_RUTO,
  ItemID.BEAN,
  ItemID.MASK_SKULL,
  ItemID.MASK_SPOOKY,
  ItemID.CHICKEN,
  ItemID.MASK_KEATON,
  ItemID.MASK_BUNNY,
  ItemID.MASK_TRUTH,
  ItemID.POCKET_EGG,
  ItemID.POCKET_CUCCO,
  ItemID.ODD_MUSHROOM,
  ItemID.ODD_POTION,
  ItemID.SAW,
  ItemID.SWORD_BROKEN,
  ItemID.PRESCRIPTION,
  ItemID.FROG,
  ItemID.EYEDROPS,
  ItemID.CLAIM_CHECK,
  ItemID.SWORD_KOKIRI,
  ItemID.SWORD_KNIFE,
  ItemID.SHIELD_DEKU,
  ItemID.SHIELD_HYLIAN,
  ItemID.SHIELD_MIRROR,
  ItemID.TUNIC_GORON,
  ItemID.TUNIC_ZORA,
  ItemID.BOOTS_IRON,
  ItemID.BOOTS_HOVER,
  ItemID.QUIVER_40,
  ItemID.QUIVER_50,
  ItemID.BOMB_BAG_20,
  ItemID.BOMB_BAG_30,
  ItemID.BOMB_BAG_40,
  ItemID.GAUNTLETS_SILVER,
  ItemID.GAUNTLETS_GOLD,
  ItemID.SCALE_SILVER,
  ItemID.SCALE_GOLD,
  ItemID.STONE_OF_AGONY,
  ItemID.GERUDO_CARD,
];

// export var importantItem: ItemID[] = {
//   // Main Progression Items
//   mainProgression: [
//     ItemID.BOW,              // Required for dungeons and bosses
//     ItemID.SLINGSHOT,        // Early game puzzles as Child Link
//     ItemID.BOOMERANG,        // Needed for Jabu-Jabu’s Belly
//     ItemID.HOOKSHOT,         // Needed for Forest Temple and other areas
//     ItemID.LONGSHOT,         // Needed for Water Temple
//     ItemID.OCARINA_OOT,      // Required for teleportation and story songs
//     ItemID.HAMMER,           // Needed for Fire Temple and boulders
//     ItemID.LETTER_ZELDA,     // Allows access to Death Mountain
//     ItemID.LETTER_RUTO,      // Needed to enter Jabu-Jabu’s Belly
//     ItemID.BOTTLE,           // Needed for Ruto's Letter and fairy healing
//     ItemID.SWORD_KOKIRI,     // Starting weapon as Child Link
//     ItemID.SHIELD_DEKU,      // Basic defense as Child Link
//     ItemID.SHIELD_HYLIAN,    // Basic defense as Adult Link
//     ItemID.SHIELD_MIRROR,    // Needed for Light Temple and reflective puzzles
//     ItemID.TUNIC_GORON,      // Required for Fire Temple survival
//     ItemID.TUNIC_ZORA,       // Needed for Water Temple breathing
//     ItemID.BOOTS_IRON,       // Needed for Water Temple
//     ItemID.BOOTS_HOVER,      // Needed for Shadow Temple
//     ItemID.BOMB_BAG_20,      // Allows bomb carrying for various puzzles
//     ItemID.GAUNTLETS_SILVER, // Needed for Spirit Temple
//     ItemID.GAUNTLETS_GOLD,   // Needed for Ganon’s Castle
//     ItemID.SCALE_SILVER,     // Needed for reaching underwater areas
//     ItemID.SCALE_GOLD,       // Allows deeper diving for items
//     ItemID.GERUDO_CARD       // Needed for access to Gerudo Fortress
//   ],

//   // Side Quest Items
//   sideQuests: [
//     ItemID.COJIRO,           // Needed for the Biggoron Sword trading quest
//     ItemID.CHICKEN,          // Trading quest item for Biggoron Sword
//     ItemID.POCKET_EGG,       // Starts the Biggoron Sword trading quest
//     ItemID.POCKET_CUCCO,     // Biggoron Sword trading quest
//     ItemID.ODD_MUSHROOM,     // Biggoron Sword trading quest
//     ItemID.ODD_POTION,       // Biggoron Sword trading quest
//     ItemID.SAW,              // Biggoron Sword trading quest
//     ItemID.SWORD_BROKEN,     // Biggoron Sword trading quest
//     ItemID.PRESCRIPTION,     // Biggoron Sword trading quest
//     ItemID.FROG,             // Biggoron Sword trading quest
//     ItemID.EYEDROPS,         // Biggoron Sword trading quest
//     ItemID.CLAIM_CHECK,      // Final step of the Biggoron Sword quest

//     ItemID.MASK_SKULL,       // Mask Trading quest item
//     ItemID.MASK_SPOOKY,      // Mask Trading quest item
//     ItemID.MASK_KEATON,      // Mask Trading quest item
//     ItemID.MASK_BUNNY,       // Mask Trading quest item
//     ItemID.MASK_TRUTH,       // Final reward in the Mask Trading quest

//     ItemID.POTION_RED,       // Optional healing item
//     ItemID.POTION_GREEN,     // Optional magic restoration item
//     ItemID.POTION_BLUE,      // Optional healing and magic restoration
//     ItemID.FAIRY,            // Optional revival item in a bottle
//     ItemID.MILK_BOTTLE,      // Optional healing item
//     ItemID.STONE_OF_AGONY,   // Allows detection of hidden grottos with Rumble Pak
//     ItemID.BEAN              // Magic Bean for shortcuts and heart pieces
//   ]
// };
