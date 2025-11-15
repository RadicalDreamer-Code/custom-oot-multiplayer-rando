# custom-oot-multiplayer-rando

Download CMake 3.31.9 from here: https://cmake.org/download/

Download boost_1_81_0-msvc-10.0-32.exe here: https://www.boost.org/releases/1.81.0/

Sobald der Build Ordner existiert, hier reingehen "custom-oot-multiplayer-rando\OOT-8.0.3-anchor-player-models-4\build\x64\vcpkg"
und im Terminal das hier eingeben:
.\vcpkg.exe install sdl2-net:x64-windows-static

Add to Project -> soh Eigenschaften -> Linker -> Eingabe -> Zusätzliche Abhängigkeiten

..\vcpkg\installed\x64-windows-static\debug\lib\SDL2_net-staticd.lib
..\vcpkg\installed\x64-windows-static\lib\SDL2_net-static.lib
ws2_32.lib
iphlpapi.lib

