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

u32 enemyIndex;

typedef struct {
    ActorID actorId;
    s16 params;
} EnemySpawnInfo;

static const std::vector<EnemySpawnInfo> ENEMY_LIST = {
    { ACTOR_EN_ZF, -1 },         // Lizalfos
    { ACTOR_EN_ZF, -2 },         // Dinolfos
    { ACTOR_EN_FLOORMAS, 0 },    // Floormaster
    { ACTOR_EN_TP, -1 },         // Elektrowurmvieh
    { ACTOR_EN_SKB, 8 },         // Stalchild
    { ACTOR_EN_GOMA, 6 },        // Mini Goma
    { ACTOR_EN_TEST, 3 },        // Stalfos
    { ACTOR_EN_RD, 0 },          // Redead
    { ACTOR_EN_RD, 0x00FE },     // Gibdo
    { ACTOR_EN_DODONGO, 0 },     // Dogongo
    { ACTOR_EN_ST, 0 },          // Skulltula
    { ACTOR_EN_FIREFLY, 0 },     // Feuer Fledermaus
    { ACTOR_EN_FIREFLY, 4 },     // Eis Fledermaus
    { ACTOR_EN_FIREFLY, 2 },     // Fledermaus
    { ACTOR_EN_MB, 0 },          // Moblin mit Keule
    { ACTOR_EN_FD, 0 },          // Feuertänzer Miniboss
    { ACTOR_EN_RR, 0 },          // Raubschleim
    { ACTOR_EN_TITE, 0 },        // Roter Arachno
    { ACTOR_EN_TITE, -2 },       // Blauer Arachno 
    { ACTOR_EN_PEEHAT, 8 },      // Ananas Vieh
    { ACTOR_EN_WF, 8 },          // Wolfos 
    { ACTOR_EN_WF, 9 },          // White Wolfos 
    { ACTOR_EN_IK, 8 }           // Iron Knuckle
};

void PunishmentManager::SpawnEnemy(ActorID actorId, int16_t params) {
    Player* player = GET_PLAYER(gPlayState);
    player->invincibilityTimer = 60;
    Actor_Spawn(&gPlayState->actorCtx, gPlayState, actorId, player->actor.world.pos.x, player->actor.world.pos.y,
                player->actor.world.pos.z, 0, 0, 0, params, 0);
}

void PunishmentManager::SpawnRandomEnemy() {
    enemyIndex = rand() % ENEMY_LIST.size();
    ActorID actor = ENEMY_LIST[enemyIndex].actorId;
    s16 params = ENEMY_LIST[enemyIndex].params;
    //enemyIndex = (enemyIndex + 1) % ENEMY_LIST.size();
    SpawnEnemy(actor, params);
}

void PunishmentManager::ExecuteRandomPunishment() {
    SpawnRandomEnemy();
}