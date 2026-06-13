#!/bin/bash
cd /workspaces/TEZCONNECT/android
./gradlew clean
./gradlew assembleRelease --stacktrace > build.log 2>&1
echo "===== LAST 60 LINES ====="
tail -60 build.log
