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

u32 enemyIndex = 24;

struct EnemySpawnInfo {
    ActorID actorId;
    s16 params = 0;
    int count = 1;
    int spawnDistanceToLink = 70;
};

static const std::vector<EnemySpawnInfo> ENEMY_LIST = {
    { ACTOR_EN_BUBBLE, 0 , 5 },  // Blasengegner aus Jabu-Jabu
    { ACTOR_EN_ZF, -1 , 2 },     // Lizalfos
    { ACTOR_EN_ZF, -2 , 2 },     // Dinolfos
    { ACTOR_EN_FLOORMAS, 0 }, // Floormaster
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
    { ACTOR_EN_FD, 0 },          // Feuertänzer Miniboss
    { ACTOR_EN_RR, 0 },          // Raubschleim
    { ACTOR_EN_TITE, 0, 3 },     // Roter Arachno
    { ACTOR_EN_TITE, -2, 3 },    // Blauer Arachno 
    { ACTOR_EN_PEEHAT, 8 },      // Ananas Vieh
    { ACTOR_EN_WF, 8, 2 },       // Wolfos 
    { ACTOR_EN_WF, 9, 2 },       // White Wolfos 
    { ACTOR_EN_IK, 8 },          // Iron Knuckle
    { ACTOR_EN_IK, 8, 10 }       // Death Penalty :D
};

void PunishmentManager::SpawnEnemy(ActorID actorId, int16_t params, int count, float spawnDistanceToLink) {
    Player* player = GET_PLAYER(gPlayState);
        player->invincibilityTimer = 60; 
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
    }
}

void PunishmentManager::SpawnRandomEnemy() {
    enemyIndex = rand() % ENEMY_LIST.size();
    SpawnEnemy(ENEMY_LIST[enemyIndex].actorId, ENEMY_LIST[enemyIndex].params, ENEMY_LIST[enemyIndex].count,
               ENEMY_LIST[enemyIndex].spawnDistanceToLink);
    //enemyIndex = (enemyIndex + 1) % ENEMY_LIST.size();
}

void PunishmentManager::ExecuteRandomPunishment() {
    SpawnRandomEnemy();
}