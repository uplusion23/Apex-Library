# Apex-Library
A lightweight, beautiful game library consolidator and launcher built on NodeJS and Node-Webkit. Supports common game libraries and custom games such as DRM Free (*pirated*) games.

### FAQ
1. **How do I add games that require Steam or UPlay?**
  - You can add a custom game under `Settings` -> `Add Custom Game`, and for the launch code, use the Steam or Uplay run URI.
    * **Example:** `steam://rungameid/{GAME ID}`

### Features
Feature | Status
--- | ---
Blizzard App Support | `Working`
Steam Support | `Working`
Origin Support | `Working`
Uplay Support | Not Started
EPIC Launcher Support | Not Started
GOG Galaxy Support | Not Started
Extra / Non-Launcher Games | `Working`
--- | ---
Settings | `Working`
Custom Cover Art | `Working`
Edit Games | `Started`
Favorites | `Working`

### Development
1. Install NodeJS
2. Download [NWJS SDK v0.33.1](https://dl.nwjs.io/v0.33.1/nwjs-sdk-v0.33.1-win-x64.zip) and place it in the root folder under `/nwjs`
3. Use `npm i` in package bin directory to install required modules.
4. Get an API key from [Steam Icon DB](https://www.steamgriddb.com/) and place it in a JSON file in the `bin` folder as `key.json`
5. Start the program with the included executable `ApexLibrary.exe`

## Images

![alt text](https://i.imgur.com/kBlHow1.png "Library Page")

![alt text](https://media.giphy.com/media/lnfgomzMzPfqhagj6G/giphy.gif)
