@echo off
title Launch Eltham CFA BA Cylinder Exchange Kiosk
echo ===================================================================
echo Starting Eltham CFA BA Cylinder Exchange Kiosk in Fullscreen Mode...
echo ===================================================================
start msedge --kiosk "https://ais-pre-dwh3ledecmua72tenlscrq-508027481207.us-east1.run.app" --edge-kiosk-type=fullscreen 2>nul || start chrome --kiosk "https://ais-pre-dwh3ledecmua72tenlscrq-508027481207.us-east1.run.app"
exit
