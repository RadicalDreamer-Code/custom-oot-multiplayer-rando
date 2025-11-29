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

enum class PunishmentType {
    SpawnRandomEnemy,
    TeleportToRandomDiscoveredLocation,
    DecreaseHealth,
    DisableSword
};

class PunishmentManager {
  public:
    static void SpawnActor(int16_t actorId, int16_t params = 0, int count = 1, float spawnDistanceToLink = 70, bool isItem = false);
    static void SpawnRandomEnemy();
    static void SpawnRandomItem();
    static PunishmentType GetRandomPunishment();
    static PunishmentType GetPunishmentByValue(int8_t punishmentValue);
    static void ExecutePunishment(PunishmentType punishment);
    static void TeleportPlayerToEntrance(int16_t entranceIndex);
    static void TeleportPlayerToRandomDiscoveredLocation();
    static void DecreaseHealth();
    static void IncreaseHealth();
    static void DisableSwordForMinutes(int minutes);
    static void InitPunishmentManager();
    static PunishmentType lastPunishmentType;
};