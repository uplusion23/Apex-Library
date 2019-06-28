var originDataDir = "C:\\ProgramData\\Origin\\LocalContent";

function getOriginGames() {
  if (!fs.existsSync(originDataDir)) {
    console.log("Origin not installed.");
  } else {
    var folders = main.getDirectories(originDataDir);
    var manifests = [];
    for (var x = 0; x < folders.length; x++) {
      main.getFilesByType("C:\\ProgramData\\Origin\\LocalContent\\" + folders[x] + "\\", /\.mfst$/, function(file) {
        manifests.push(file)
      });
    }
    for (var x = 0; x < manifests.length; x++) {
      var manifest = manifests[x];
      var manifestRaw = fs.readFileSync(manifest);
      manifestRaw = decodeURIComponent(manifestRaw.toString());
      var manifestChunks = manifestRaw.replace("?", "").split("&");
      var installDir = manifestChunks.filter(s => s.includes('dipinstallpath'))
      var launchString = manifestChunks.filter(s => s.includes('id=Origin'))
      installDir = installDir[0].replace('dipinstallpath=', '');

      launchString = launchString[0].replace('id=', '');
      var xmlManifest = fs.readFileSync(installDir.replace('\\', '\\\\') + '__Installer\\installerdata.xml');
      var jsonManifest = JSON.parse(convert.xml2json(xmlManifest, {compact: true, spaces: 2}));
      jsonManifest.DiPManifest.gameTitles.gameTitle[0]._text = jsonManifest.DiPManifest.gameTitles.gameTitle[0]._text.replace(/['"\u0040\u0026\u2122\u00ae]/g, "");

      var data = {
        title: jsonManifest.DiPManifest.gameTitles.gameTitle[0]._text,
        dir: installDir.replace('\\', '\\\\'),
        launch: "origin2://game/launch?offerIds=" + launchString,
        noArt: true,
        vendor: "origin",
        remove: false
      }

      // Seems to work, but too fast on initial call, that is messes up.
      main.getCoverArtByName(data.title, function(coverArt) {
        if (coverArt == undefined) {
          console.groupCollapsed("Cover Error")
          console.log("Unable to find cover art for game: " + jsonManifest.DiPManifest.gameTitles.gameTitle[0]._text);
          console.groupEnd();
          data.noArt = true;
        } else {
          data.noArt = false;
        }
        data.cover = coverArt;
        main.addGame(data);
      });

    }
  }
}

//origin2://game/launch?offerIds=Origin.OFR.50.0002694
