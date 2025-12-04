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
#include "soh/Enhancements/punishments/Header1.h"
extern "C" {
#include <z64.h>
#include "macros.h"
#include "functions.h"
#include "variables.h"
}


u32 enemyIndex = 0;
u32 itemIndex = 0;
u8 iceTrapWasTriggered = 0;
u8 quizWasTriggered = 0;
uint32_t lastIceTrapCount = 0;
bool ignoreNextIceTrapUpdate = true;
s32 swordDisabledFrames = 0;
int playBubleSound = 0;

struct ActorSpawnInfo {
    int16_t actorId;
    s16 params = 0; // Wird oft benötigt, um den Gegner korrekt zu spawnen oder manchmal für verschiedene Gegner Varianten. Im jeweiligen Header des Actors findet man da oft Infos zu, sonst im .c Skript des Actors nach actor.params suchen.
    int count = 1; // Wie oft der Gegner gespawnt werden soll
    int spawnDistanceToLink = 70; // Abstand zu Link beim Spawn
    bool isCollectable = false; // Muss true sein, wenn man collectable Items wie Rubine oder Herzen spawnen will etc.
    bool spawnWithEffect = true; // Bestimmt, ob ein Ganon Warp Effekt beim Spawn auftritt
};

struct DelayedSpawnInfo {
    int16_t actorId;
    s16 params = 0;
    Vec3f_ position;
    int16_t yRot;
    int16_t framesDelay = 30;
};

static std::vector<int16_t> sDiscoveredEntrances;
static std::deque<PunishmentType> sPendingPunishments;
static std::deque<DelayedSpawnInfo> sPendingEnemySpawns;

static const std::vector<ActorSpawnInfo> ENEMY_LIST = {
    // https : // zeldamodding.net/zelda-oot-enemy-actor-list/
    // Actor IDs: https://wiki.cloudmodding.com/oot/Actor_List_(Variables)
    { ACTOR_EN_DH, 0, 1, 70, false, false },      // Großer Hirnsauger
    { ACTOR_EN_PO_SISTERS, 8 },  // Purple Poe Forest Temple Mini Boss
    { ACTOR_EN_NY, 0, 3 },       // Spike
    { ACTOR_EN_SB, 0, 3 },       // Shellblade / Muschel
    { ACTOR_EN_CLEAR_TAG, 1 , 3},// Arwing
    { ACTOR_EN_TORCH2, 0 },      // Dark Link
    { ACTOR_EN_EIYER, 10, 3 },   // Rochenviecher aus Jabu-Jabu
    { ACTOR_EN_BUBBLE, 0 , 5 },  // Blasengegner aus Jabu-Jabu
    { ACTOR_EN_ZF, -1 , 2 },     // Lizalfos
    { ACTOR_EN_ZF, -2 , 2 },     // Dinolfos
    { ACTOR_EN_FLOORMAS, 0 },    // Floormaster
    { ACTOR_EN_WALLMAS, 0, 1, 70, false, false }, // Wallmaster
    { ACTOR_EN_TP, -1, 3 },      // Elektrowurmvieh
    { ACTOR_EN_SKB, 8, 3 },      // Stalchild
    { ACTOR_EN_GOMA, 6, 3 },     // Mini Goma
    { ACTOR_EN_TEST, 2, 2 },     // Stalfos
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
    //{ ACTOR_EN_AM, 1, 2, 10},    // Armos, Statuending
    { ACTOR_EN_BILI, -1, 3},     // Qualle/Stinger
    { ACTOR_EN_CROW, 1, 5 },     // Guay evtl TODO: soll nicht nachspawnen, custom param
    { ACTOR_EN_BW, 0, 3},        // Feuerschnecke
    { ACTOR_EN_FZ, 0, 2},        // Freezard
    { ACTOR_EN_DEKUBABA, 1, 2},  // Big Deku Baba
    { ACTOR_EN_DEKUBABA, 2, 3},  // Small Deku Baba
    { ACTOR_EN_DODOJR, 0, 3 },   // Kleiner Dodongo
    { ACTOR_EN_BB, -2, 3 },      // Fliegender Totenkopf Variante
    { ACTOR_EN_BB, -1, 2 }      // Fliegender Totenkopf Variante
    // { ACTOR_EN_POH, 2, 2 }, // Graveyard Pow spawnen irgendwie nicht
    // { ACTOR_EN_PO_FIELD, 0, 2}   // Poe spawnen sehr spät aber ok TODO: Evtl mit Custom Param schneller spawnen
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

static const std::vector<ActorSpawnInfo> ITEM_LIST = { 
    { ACTOR_ITEM_B_HEART, 8, 1, 0 },
    { ITEM00_RUPEE_PURPLE, 0, 10, 50, true },
    { ITEM00_HEART, 0, 20, 50, true }
};

static bool IsPlayerControllable(bool includeInputBlock = true) {
    if (!GameInteractor::IsSaveLoaded() || gPlayState == nullptr) {
        return false;
    }
    Player* player = GET_PLAYER(gPlayState);
    if (player == nullptr) {
        return false;
    }
    if (GameInteractor::IsGameplayPaused()) {
        return false;
    }
    if (gPlayState->transitionTrigger != TRANS_TRIGGER_OFF) {
        return false;
    }
    if (gPlayState->transitionMode != 0) {
        return false;
    }
    if (gPlayState->csCtx.state != CS_STATE_IDLE) {
        return false;
    }
    if (gPlayState->shootingGalleryStatus != 0) {
        return false;
    }
    if (Player_InBlockingCsMode(gPlayState, player)) {
        return false;
    }
    if (includeInputBlock && player->stateFlags1 & PLAYER_STATE1_INPUT_DISABLED) {
        return false;
    }
    if (player->stateFlags3 & PLAYER_STATE3_PAUSE_ACTION_FUNC) {
        return false;
    }
    if (player->stateFlags2 & PLAYER_STATE2_FROZEN) {
        return false;
    }
    if (player->stateFlags1 & PLAYER_STATE1_DEAD) {
        return false;
    }
    if (player->stateFlags2 & PLAYER_STATE2_GRABBED_BY_ENEMY) {
        return false;
    }
    if (player->stateFlags2 & PLAYER_STATE2_OCARINA_PLAYING) {
        return false;
    }
    if (player->invincibilityTimer > 0) {
        return false;
    }
    /* if (player->stateFlags1 & PLAYER_STATE1_HANGING_OFF_LEDGE) {
        return false;
    }
    if (player->stateFlags1 & PLAYER_STATE1_CLIMBING_LADDER) {
        return false;
    }
    if (player->stateFlags1 & PLAYER_STATE1_CLIMBING_LEDGE) {
        return false;
    }
    if (player->stateFlags1 & PLAYER_STATE1_JUMPING) {
        return false;
    } */

    return true;
}

// Nach betreten jeder Loading Zone den Ort in die Liste eintragen, wenn er noch nicht drin steht
void RegisterDiscoveredEntrancesTracker() {
    GameInteractor::Instance->RegisterGameHook<GameInteractor::OnTransitionEnd>([](int32_t sceneNum) {
        if (!GameInteractor::IsSaveLoaded()) {
            return;
        }
         Entrance_SetCustomEntranceDiscovered(gSaveContext.entranceIndex, false);
    });
}

void RegisterPunishmentQueueExecution() {
    GameInteractor::Instance->RegisterGameHook<GameInteractor::OnPlayerUpdate>([]() {
        if (sPendingPunishments.empty()) {
            return;
        }
        if (!IsPlayerControllable()) {
            return;
        }
        PunishmentType punishment = sPendingPunishments.front();
        sPendingPunishments.pop_front();
        PunishmentManager::ExecutePunishment(punishment);
    });
}

void RegisterQuizCallbacks() {
    GameInteractor::Instance->RegisterGameHook<GameInteractor::OnPlayerUpdate>([]() {

        Player* player = GET_PLAYER(gPlayState);
        Input* input = &gPlayState->state.input[0];

        if (CHECK_BTN_ALL(input[0].press.button, BTN_DUP) && !quizWasTriggered) {
            // Nur für Debug Zwecke. Später auskommentieren
            //iceTrapWasTriggered = 1;
        } 

        auto currentIceTrapCount = gSaveContext.sohStats.count[COUNT_ICE_TRAPS];
        if (currentIceTrapCount > lastIceTrapCount) {
            lastIceTrapCount = currentIceTrapCount;
            if (ignoreNextIceTrapUpdate) {
                //ignoreNextIceTrapUpdate = false;
            } else {
                //iceTrapWasTriggered = 1;
            }
        }

        if (IS_RANDO && quizWasTriggered && gPlayState->msgCtx.msgMode == MSGMODE_TEXT_DONE && Message_ShouldAdvance(gPlayState)) {
            u8 option = gPlayState->msgCtx.choiceIndex;
            player->stateFlags1 &= ~PLAYER_STATE1_INPUT_DISABLED;
            Message_Answered(option);
            quizWasTriggered = 0;
        }

        if (IS_RANDO && (quizWasTriggered || iceTrapWasTriggered) &&
            Message_GetState(&gPlayState->msgCtx) == TEXT_STATE_NONE && IsPlayerControllable(true)) {
            player->stateFlags1 |= PLAYER_STATE1_INPUT_DISABLED;
            Message_StartTextbox(gPlayState, 0x90FD, &player->actor);
            iceTrapWasTriggered = 0;
            quizWasTriggered = 1;
        }
    });
}

void PunishmentManager::DisableSwordForMinutes(int minutes) {
    const int framesPerSecond = 20;
    swordDisabledFrames = minutes * 60 * framesPerSecond;
    playBubleSound = 1;
    Audio_PlaySoundGeneral(NA_SE_EN_BUBLE_UP, &D_801333D4, 4, &D_801333E0, &D_801333E0, &D_801333E8);
}

void RegisterSwordDisablingHandler() {
    GameInteractor::Instance->RegisterGameHook<GameInteractor::OnGameFrameUpdate>([]() {

        if (!GameInteractor::IsSaveLoaded() || gPlayState == nullptr) {
            return;
        }
        if (swordDisabledFrames <= 0) {
            return;
        }
     
        swordDisabledFrames--;

        Player* player = GET_PLAYER(gPlayState);
        if (player->heldItemAction == PLAYER_IA_SWORD_MASTER || player->heldItemAction == PLAYER_IA_SWORD_KOKIRI || player->heldItemAction == PLAYER_IA_SWORD_BIGGORON) {
            player->meleeWeaponState = 0;
            player->itemAction = PLAYER_IA_NONE;
            player->heldItemAction = PLAYER_IA_NONE;
        }

        Actor* actor = &player->actor;
        if (actor->colorFilterTimer <= 1) {
            Actor_SetColorFilter(actor, 0, 255, 0, 40); 
            if (playBubleSound == 0) Audio_PlaySoundGeneral(NA_SE_EN_BUBLE_LAUGH, &D_801333D4, 4, &D_801333E0, &D_801333E0, &D_801333E8);
            playBubleSound = (playBubleSound + 1) % 4;
        }

        if (swordDisabledFrames == 0) {
            actor->colorFilterTimer = 0;
        }
    });
}

void RegisterEnemySpawner() {
    GameInteractor::Instance->RegisterGameHook<GameInteractor::OnGameFrameUpdate>([]() {
        if (!GameInteractor::IsSaveLoaded() || gPlayState == nullptr) {
            return;
        }
        if (sPendingEnemySpawns.size() <= 0) {
            return;
        }

        for (int i = 0; i < sPendingEnemySpawns.size(); i++) {
            sPendingEnemySpawns[i].framesDelay--;
        }

        if (sPendingEnemySpawns[0].framesDelay > 0)
            return;

        while (sPendingEnemySpawns.size() > 0 && sPendingEnemySpawns[0].framesDelay <= 0) {
            DelayedSpawnInfo spawnInfo = sPendingEnemySpawns.front();
            sPendingEnemySpawns.pop_front();

            auto actor = Actor_Spawn(&gPlayState->actorCtx, gPlayState, spawnInfo.actorId, spawnInfo.position.x,
                        spawnInfo.position.y, spawnInfo.position.z, 0, spawnInfo.yRot, 0, spawnInfo.params, 0);
            Actor_SetColorFilter(actor, 0x8000, 255, 0, 20); 
        }
    });
}

void PunishmentManager::SpawnActor(int16_t actorId, int16_t params, int count, float spawnDistanceToLink, bool isCollectable, bool spawnWithEffect) {
    Player* player = GET_PLAYER(gPlayState);
        //player->invincibilityTimer = 60; // Invincibility, damit man nicht instant nach dem Spawn gedamaged wird
    for (int i = 0; i < count; i++) {
        // Actor werden gleichmäßig um Link herum aufgestellt, wenn es mehrere sind
        int rotationOffset = 0x8000;
        if (count == 2) rotationOffset = 0x4000;
        s16 yaw = player->actor.shape.rot.y + rotationOffset + i * (0x10000 / count);
        f32 offsetX = Math_SinS(yaw) * spawnDistanceToLink;
        f32 offsetZ = Math_CosS(yaw) * spawnDistanceToLink;
        // Actor schaut in Links Richtung
        Vec3f_ position;
        position.x = player->actor.world.pos.x + offsetX;
        position.y = player->actor.world.pos.y;
        position.z = player->actor.world.pos.z + offsetZ;
        s16 enemyRotY = yaw + 0x8000;
        if (isCollectable) {
            if (actorId == ITEM00_HEART && gSaveContext.healthCapacity == gSaveContext.health) {   
                Item_DropCollectibleRandom(gPlayState, &player->actor, &position, 0x80);
            } else {
                Item_DropCollectible(gPlayState, &position, actorId);
            }
        } else {
            if (spawnWithEffect) {
                auto spawnEffect = Actor_Spawn(&gPlayState->actorCtx, gPlayState, ACTOR_EN_FHG_FIRE, position.x,
                                               position.y + 3.0f, position.z, 0x4000, 0, 0, 40, 0);
                spawnEffect->scale.z = 2.0f;
                spawnEffect->scale.y = 4.0f;
                spawnEffect->scale.x = 4.0f;
                DelayedSpawnInfo spawnInfo;
                spawnInfo.actorId = actorId;
                spawnInfo.params = params;
                spawnInfo.position = position;
                spawnInfo.yRot = enemyRotY;
                sPendingEnemySpawns.push_back(spawnInfo);
                GameInteractor::RawAction::ElectrocutePlayer();
            } else {
                Actor_Spawn(&gPlayState->actorCtx, gPlayState, actorId, position.x, position.y, position.z, 0, enemyRotY, 0, params, 0);
            }
        }    
        if (actorId == ACTOR_EN_DH) {
            SpawnActor(ACTOR_EN_DHA, 0, 4, 70, false, false);
        }
    }
}

void PunishmentManager::SpawnRandomEnemy() {
    enemyIndex = rand() % ENEMY_LIST.size();
    SpawnActor(ENEMY_LIST[enemyIndex].actorId, ENEMY_LIST[enemyIndex].params, ENEMY_LIST[enemyIndex].count,
               ENEMY_LIST[enemyIndex].spawnDistanceToLink, false, ENEMY_LIST[enemyIndex].spawnWithEffect);
    //enemyIndex = (enemyIndex + 1) % ENEMY_LIST.size();
}

void PunishmentManager::SpawnRandomItem() {
    itemIndex = rand() % ITEM_LIST.size();
    SpawnActor(ITEM_LIST[itemIndex].actorId, ITEM_LIST[itemIndex].params, ITEM_LIST[itemIndex].count,
               ITEM_LIST[itemIndex].spawnDistanceToLink, ITEM_LIST[itemIndex].isCollectable, false);
    // itemIndex = (itemIndex + 1) % ITEM_LIST.size();
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
    int max = static_cast<int>(PunishmentType::DisableSword);
    return static_cast<PunishmentType>(rand() % (max + 1));
}


// TODO: Maybe not necessery
PunishmentType PunishmentManager::GetPunishmentByValue(int8_t punishmentValue) {
    return static_cast<PunishmentType>(punishmentValue);
}

void PunishmentManager::ExecutePunishment(PunishmentType punishment) {
    // TODO: have multiple types

     if (!IsPlayerControllable()) {
        sPendingPunishments.push_back(punishment);
        return;
    }

    switch (punishment) { 
        case PunishmentType::SpawnRandomEnemy:
            SpawnRandomEnemy();
            break;
        case PunishmentType::TeleportToRandomDiscoveredLocation:
            TeleportPlayerToRandomDiscoveredLocation();
            break;
        case PunishmentType::DecreaseHealth:
            DecreaseHealth();
            break;
        case PunishmentType::DisableSword:
            DisableSwordForMinutes(15);
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
        ExecutePunishment(PunishmentType::SpawnRandomEnemy);
        return;
    }
    TeleportPlayerToEntrance(entrance);
}

void PunishmentManager::DecreaseHealth() {
    if (gSaveContext.healthCapacity <= 32) {
        printf("Health kann nicht weniger als 2 Herzen sein!");
        ExecutePunishment(PunishmentType::SpawnRandomEnemy);
        return;
    }

    gSaveContext.healthCapacity -= 0x10;
    if (gSaveContext.health > gSaveContext.healthCapacity) {
        gSaveContext.health = gSaveContext.healthCapacity;
    }

    // Sound Effekt bei Max Health Decrease
    GameInteractor::RawAction::KnockbackPlayer(0);
    Audio_PlaySoundGeneral(NA_SE_EN_PO_LAUGH, &D_801333D4, 4, &D_801333E0, &D_801333E0, &D_801333E8);

    // Visueller Effekt bei Max Health Decrease
    Player* player = GET_PLAYER(gPlayState);
    Vec3f vec;
    vec.x = player->actor.world.pos.x;
    vec.y = player->actor.world.pos.y + 45.0f;
    vec.z = player->actor.world.pos.z;
    Vec3f zeroVec = { 0.0f, 0.0f, 0.0f };
    EffectSsDeadDb_Spawn(gPlayState, &vec, &zeroVec, &zeroVec, 150, 0, 120, 0, 200, 200, 30, 0, 80, 1, 9, 0);
}

void PunishmentManager::SetIceTrapTriggered() {
    iceTrapWasTriggered = 1;
}


void PunishmentManager::IncreaseHealth() {
    gSaveContext.healthCapacity += 0x10;
    gSaveContext.health += 0x10;
}

PunishmentType PunishmentManager::lastPunishmentType = PunishmentType::SpawnRandomEnemy;

void PunishmentManager::InitPunishmentManager() {
    RegisterDiscoveredEntrancesTracker();
    RegisterPunishmentQueueExecution();
    RegisterQuizCallbacks();
    RegisterSwordDisablingHandler();
    RegisterEnemySpawner();
    lastIceTrapCount = gSaveContext.sohStats.count[COUNT_ICE_TRAPS];
}
