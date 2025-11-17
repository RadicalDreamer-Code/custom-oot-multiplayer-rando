#pragma once
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

class PunishmentManager {
  public:
    static void SpawnEnemy(ActorID actorId, int16_t params);

  public:
    static void SpawnRandomEnemy();

  public:
    static void ExecuteRandomPunishment();
};