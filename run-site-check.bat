@echo off
cd /d D:\werewolf-site
if not exist .tmp-check mkdir .tmp-check
echo started > .tmp-check\started.txt
call node scripts\sync-game-tooltips.mjs > .tmp-check\sync-log.txt 2>&1
call npm run build > .tmp-check\build-log.txt 2>&1
echo finished > .tmp-check\done.txt
