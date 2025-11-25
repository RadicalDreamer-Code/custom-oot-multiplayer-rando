#include "PunishmentManager.h"
#include <libultraship/libultraship.h>
#include <soh/OTRGlobals.h>
#include <soh/Enhancements/item-tables/ItemTableManager.h>
#include <soh/Enhancements/randomizer/randomizerTypes.h>
#include <soh/Enhancements/randomizer/adult_trade_shuffle.h>
#include <overlays/actors/ovl_Link_Puppet/z_link_puppet.h>
#include <soh/Enhancements/nametag.h>
#include <soh/Enhancements/presets.h>
#include <soh/Enhancements/randomizer/randomizer_check_tracker.h>
#include <soh/util.h>
#include "soh/Enhancements/game-interactor/GameInteractor_Anchor.h"

u32 enemyIndex = 0;

static std::vector<int16_t> sDiscoveredEntrances;

struct EnemySpawnInfo {
    ActorID actorId;
    s16 params = 0; // Wird oft benötigt, um den Gegner korrekt zu spawnen oder manchmal für verschiedene Gegner Varianten. Im jeweiligen Header des Actors findet man da oft Infos zu, sonst im .c Skript des Actors nach actor.params suchen.
    int count = 1; // Wie oft der Gegner gespawnt werden soll
    int spawnDistanceToLink = 70; // Abstand zu Link beim Spawn
};

static const std::vector<EnemySpawnInfo> ENEMY_LIST = {
    // https : // zeldamodding.net/zelda-oot-enemy-actor-list/
    // Actor IDs: https://wiki.cloudmodding.com/oot/Actor_List_(Variables)
    { ACTOR_EN_PO_SISTERS, 8 },  // Purple Poe Forest Temple Mini Boss
    { ACTOR_EN_NY, 0, 3 },       // Spike
    { ACTOR_EN_SB, 0, 3 },       // Shellblade / Muschel
    { ACTOR_EN_CLEAR_TAG, 1 , 3},// Arwing
    { ACTOR_EN_TORCH2, 0 },      // Dark Link
    { ACTOR_EN_DH, 0},           // Großer Hirnsauger
    { ACTOR_EN_EIYER, 10, 3 },   // Rochenviecher aus Jabu-Jabu
    { ACTOR_EN_BUBBLE, 0 , 5 },  // Blasengegner aus Jabu-Jabu
    { ACTOR_EN_ZF, -1 , 2 },     // Lizalfos
    { ACTOR_EN_ZF, -2 , 2 },     // Dinolfos
    { ACTOR_EN_FLOORMAS, 0 },    // Floormaster
    { ACTOR_EN_WALLMAS, 0 },     // Wallmaster
    { ACTOR_EN_TP, -1, 3 },      // Elektrowurmvieh
    { ACTOR_EN_SKB, 8, 3 },      // Stalchild
    { ACTOR_EN_GOMA, 6, 3 },     // Mini Goma
    { ACTOR_EN_TEST, 3, 2 },     // Stalfos
    { ACTOR_EN_RD, 0 },          // Redead
    { ACTOR_EN_RD, 0x00FE },     // Gibdo
    { ACTOR_EN_DODONGO, 0, 2 },  // Dogongo
    { ACTOR_EN_ST, 0, 3 },       // Skulltula
    { ACTOR_EN_FIREFLY, 0, 5 },  // Feuer Fledermaus
    { ACTOR_EN_FIREFLY, 4, 5 },  // Eis Fledermaus
    { ACTOR_EN_FIREFLY, 2, 5 },  // Fledermaus
    { ACTOR_EN_MB, 0 },          // Moblin mit Keule
    { ACTOR_EN_MB, -1, 3 },      // Moblin mit Speer
    { ACTOR_EN_FD, 0 },          // Feuertänzer Miniboss
    { ACTOR_EN_RR, 0 },          // Raubschleim
    { ACTOR_EN_TITE, 0, 3 },     // Roter Arachno
    { ACTOR_EN_TITE, -2, 3 },    // Blauer Arachno 
    { ACTOR_EN_PEEHAT, 8 },      // Ananas Vieh
    { ACTOR_EN_WF, 8, 2 },       // Wolfos 
    { ACTOR_EN_WF, 9, 2 },       // White Wolfos 
    { ACTOR_EN_IK, 8 },          // Iron Knuckle
    { ACTOR_EN_IK, 8, 10 },      // Death Penalty :D
    { ACTOR_EN_AM, 1, 2, 10},    // Armos, Statuending
    { ACTOR_EN_BILI, -1, 3},     // Qualle/Stinger
    { ACTOR_EN_CROW, 1, 5 },     // Guay evtl TODO: soll nicht nachspawnen, custom param
    { ACTOR_EN_BW, 0, 3},        // Feuerschnecke
    { ACTOR_EN_FZ, 0, 2},        // Freezard
    { ACTOR_EN_DEKUBABA, 1, 2},  // Big Deku Baba
    { ACTOR_EN_DEKUBABA, 2, 3},  // Small Deku Baba
    { ACTOR_EN_DODOJR, 0, 3 },   // Kleiner Dodongo
    { ACTOR_EN_BB, -2, 3 },      // Fliegender Totenkopf Variante
    { ACTOR_EN_BB, -1, 2 },      // Fliegender Totenkopf Variante
    { ACTOR_EN_PO_FIELD, 0, 2}   // Poe spawnen sehr spät aber ok TODO: Evtl mit Custom Param schneller spawnen
    // { ACTOR_EN_GELDB, 0 },       // Gerudo Kriegerin braucht Carpenter zum laden oder so
    // { ACTOR_EN_DEKUNUTS, 0, 3 },  // Mad Scrub, es spawnen keine Nüsse, wenn sie schießen
    // { ACTOR_EN_BA, 0 },           // Tentacle funktioniert zwar, aber spawnt zu tief und bräuchte nen Sonder Case für spawning Höhe
    // { ACTOR_EN_VALI, 1, 2},   // Große Qualle funktioniert nicht
    // { ACTOR_EN_ANUBICE, 0, 3},// Anubis bewegen sich nicht, sind aber eh lame
    // { ACTOR_EN_BIGOKUTA, 3 }, // Großer Okto, super buggy
    // { ACTOR_EN_OKUTA, 0x10 }, // Oktorok funktioniert nicht, TODO: Custom param für spawn Bedingung
    // { ACTOR_EN_REEBA, 0 },    // Leever braucht Sand Surface type TODO: Custom param für any surface
    // { ACTOR_EN_REEBA, 1 },    // Leever big braucht Sand Surface type TODO: Custom param für any surface
    // { ACTOR_EN_VM, 1, 2 }     // Beamos und Big Beamos greigen nicht an: TODO Custom Param
};

// Nach betreten jeder Loading Zone den Ort in die Liste eintragen, wenn er noch nicht drin steht
void RegisterDiscoveredEntrancesTracker() {
    GameInteractor::Instance->RegisterGameHook<GameInteractor::OnTransitionEnd>([](int32_t sceneNum) {
        if (!GameInteractor::IsSaveLoaded()) {
            return;
        }
         Entrance_SetCustomEntranceDiscovered(gSaveContext.entranceIndex, false);
         //int16_t entrance = gSaveContext.entranceIndex;
         /* if (std::find(sDiscoveredEntrances.begin(), sDiscoveredEntrances.end(), entrance) ==
            sDiscoveredEntrances.end()) {
            sDiscoveredEntrances.push_back(entrance);
        }*/
    });
}

void PunishmentManager::SpawnEnemy(ActorID actorId, int16_t params, int count, float spawnDistanceToLink) {
    Player* player = GET_PLAYER(gPlayState);
        player->invincibilityTimer = 60; // Invincibility, damit man nicht instant nach dem Spawn gedamaged wird
    for (int i = 0; i < count; i++) {
        // Gegner werden gleichmäßig um Link herum aufgestellt, wenn es mehrere sind
        int rotationOffset = 0x8000;
        if (count == 2) rotationOffset = 0x4000;
        s16 yaw = player->actor.shape.rot.y + rotationOffset + i * (0x10000 / count);
        f32 offsetX = Math_SinS(yaw) * spawnDistanceToLink;
        f32 offsetZ = Math_CosS(yaw) * spawnDistanceToLink;
        // Gegner schaut in Links Richtung
        s16 enemyRotY = yaw + 0x8000;
        Actor_Spawn(&gPlayState->actorCtx, gPlayState, actorId, player->actor.world.pos.x + offsetX,
                    player->actor.world.pos.y, player->actor.world.pos.z + offsetZ, 0, enemyRotY, 0, params, 0);
        if (actorId == ACTOR_EN_DH) {
            SpawnEnemy(ACTOR_EN_DHA, 0, 4);
        }
    }
}

void PunishmentManager::SpawnRandomEnemy() {
    enemyIndex = rand() % ENEMY_LIST.size();
    SpawnEnemy(ENEMY_LIST[enemyIndex].actorId, ENEMY_LIST[enemyIndex].params, ENEMY_LIST[enemyIndex].count,
               ENEMY_LIST[enemyIndex].spawnDistanceToLink);
    //enemyIndex = (enemyIndex + 1) % ENEMY_LIST.size();
}

/*
PunishmentType PunishmentManager::GetRandomPunishment() {
    // Liste aller erlaubten Werte (ohne None)
    static const PunishmentType punishments[] = { PunishmentType::SpawnRandomEnemy,
                                                  PunishmentType::TeleportToRandomDiscoveredLocation };

    int count = sizeof(punishments) / sizeof(punishments[0]);
    int index = rand() % count;

    return punishments[index];
}
*/

PunishmentType PunishmentManager::GetRandomPunishment() {
    // CAREFUL: max muss der letzte enum entry sein
    int max = static_cast<int>(PunishmentType::TeleportToRandomDiscoveredLocation);
    return static_cast<PunishmentType>(rand() % (max + 1));
}


// TODO: Maybe not necessery
PunishmentType PunishmentManager::GetPunishmentByValue(int8_t punishmentValue) {
    return static_cast<PunishmentType>(punishmentValue);
}

void PunishmentManager::ExecutePunishment(PunishmentType punishment) {
    // TODO: have multiple types

    switch (punishment) { 
        case PunishmentType::SpawnRandomEnemy:
            SpawnRandomEnemy();
            break;
        case PunishmentType::TeleportToRandomDiscoveredLocation:
            TeleportPlayerToRandomDiscoveredLocation();
            break;
        default:
            break;
    }
    lastPunishmentType = punishment;
}

void PunishmentManager::TeleportPlayerToEntrance(int16_t entranceIndex) {
    gPlayState->nextEntranceIndex = entranceIndex;
    gPlayState->transitionTrigger = TRANS_TRIGGER_START;
    gPlayState->transitionType = TRANS_TYPE_FADE_WHITE;
    gSaveContext.nextTransitionType = TRANS_TYPE_FADE_WHITE;
}

static bool IsEntranceDiscovered(s16 entranceIndex) {
    if (entranceIndex < 0) {
        return false;
    }

    const int bitsPerWord = 32;
    int idx = entranceIndex / bitsPerWord;
    int bit = entranceIndex % bitsPerWord;

    if (idx >= SAVEFILE_ENTRANCES_DISCOVERED_IDX_COUNT) {
        return false;
    }

    return (gSaveContext.sohStats.customEntrances[idx] & (1u << bit)) != 0;
}

#include <vector>

static s16 GetRandomDiscoveredEntrance() {
    std::vector<s16> discoveredList;

    const int bitsPerWord = 32;
    const int maxEntrances = SAVEFILE_ENTRANCES_DISCOVERED_IDX_COUNT * bitsPerWord;

    for (s16 entrance = 0; entrance < maxEntrances; ++entrance) {
        if (IsEntranceDiscovered(entrance)) {
            discoveredList.push_back(entrance);
        }
    }

    if (discoveredList.empty()) {
        return -1;
    }

    s32 idx = rand() % discoveredList.size();
    return discoveredList[idx];
}

void PunishmentManager::TeleportPlayerToRandomDiscoveredLocation() {
    /* if (!GameInteractor::IsSaveLoaded() || sDiscoveredEntrances.empty()) {
        printf("Keine bekannten Orte zum Teleportieren!");
        return;
    }
    int idx = rand() % sDiscoveredEntrances.size();
    int16_t entrance = sDiscoveredEntrances[idx]; */
    
    int16_t entrance = GetRandomDiscoveredEntrance();
    if (entrance < 0) {
        printf("Keine bekannten Orte zum Teleportieren!");
        return;
    }
    TeleportPlayerToEntrance(entrance);
}

PunishmentType PunishmentManager::lastPunishmentType = PunishmentType::SpawnRandomEnemy;

void PunishmentManager::InitPunishmentManager() {
    RegisterDiscoveredEntrancesTracker();
}
