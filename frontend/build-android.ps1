# Build Android APK for B Livre
# Requirements: JDK 17+, Android SDK command-line tools

$ErrorActionPreference = "Stop"
$androidDir = Join-Path $PSScriptRoot "android"
$apkOutput = Join-Path $PSScriptRoot "build" "B-Livre.apk"

# Step 1: Build web app
Write-Host "=== Building web app ==="
Set-Location -Path $PSScriptRoot
npm run build

# Step 2: Sync Capacitor
Write-Host "=== Syncing Capacitor ==="
npx cap sync

# Step 3: Set up environment
Write-Host "=== Setting up environment ==="
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:ANDROID_HOME\platform-tools;$env:Path"

# Ensure local.properties exists
Set-Content -Path (Join-Path $androidDir "local.properties") -Value "sdk.dir=$env:ANDROID_HOME"

# Fix Java 17 compatibility (Capacitor 7 defaults to Java 21)
$capBuildGradle = Join-Path $PSScriptRoot "node_modules" "@capacitor" "android" "capacitor" "build.gradle"
(Get-Content $capBuildGradle) -replace 'VERSION_21', 'VERSION_17' | Set-Content $capBuildGradle

$capBuildGradleApp = Join-Path $androidDir "app" "capacitor.build.gradle"
(Get-Content $capBuildGradleApp) -replace 'VERSION_21', 'VERSION_17' | Set-Content $capBuildGradleApp

# Step 4: Build APK
Write-Host "=== Building APK ==="
Set-Location -Path $androidDir
.\gradlew.bat assembleDebug --no-daemon

# Step 5: Copy APK
Write-Host "=== Copying APK ==="
$apkSrc = Get-ChildItem -Path (Join-Path $androidDir "app\build\outputs\apk") -Recurse -Filter "*.apk" | Select-Object -First 1
if ($apkSrc) {
    Copy-Item -Path $apkSrc.FullName -Destination $apkOutput -Force
    Write-Host "APK generated: $apkOutput ($(($apkSrc.Length / 1MB -as [int])) MB)"
    Write-Host "MD5: $((Get-FileHash $apkOutput -Algorithm MD5).Hash)"
} else {
    Write-Error "APK not found!"
}

Set-Location -Path $PSScriptRoot
