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

static const std::vector<ActorID> ENEMY_LIST = {
    ACTOR_EN_DODONGO, // Dogongo
    ACTOR_EN_ST, // Skulltula
    ACTOR_EN_FIREFLY, // Feuer Fledermaus
    ACTOR_EN_MB, // Moblin mit Keule
    ACTOR_EN_GOMA, // Mini Goma
    //ACTOR_EN_ICE_HONO, // Nur blaues Feuer
    ACTOR_EN_FD, // Feuertänzer Miniboss
    //ACTOR_EN_FD_FIRE, // Spiel stürzt ab
    //ACTOR_EN_SW, // Spiel stürzt ab oder läft nicht
    //ACTOR_EN_BB, // Spiel stürzt ab oder läft nicht
    ACTOR_EN_RR, // Rotes Springspinnen Ding vom Todeskrater Pfad
    ACTOR_EN_TITE, // Raumschleim
    ACTOR_EN_PEEHAT, // Ananas Vieh
    ACTOR_EN_WF, // Wolf
    //ACTOR_EN_KO, // Lädt nicht
    ACTOR_EN_IK // Iron Knuckle
    //ACTOR_EN_DS // Kein Gegner
};

void PunishmentManager::SpawnRandomEnemy() {
    enemyIndex = rand() % ENEMY_LIST.size();
    ActorID actor = ENEMY_LIST[enemyIndex];
    //enemyIndex = (enemyIndex + 1) % ENEMY_LIST.size();
    
    Player* player = GET_PLAYER(gPlayState);
    player->invincibilityTimer = 60;

    Actor_Spawn(&gPlayState->actorCtx,
                gPlayState,     
                actor,
                player->actor.world.pos.x, player->actor.world.pos.y, player->actor.world.pos.z,
                0, 0, 0, 0, 0
    );
}

void PunishmentManager::ExecuteRandomPunishment() {
    SpawnRandomEnemy();
}