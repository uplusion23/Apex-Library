const isRunning = (query, cb) => {
    let platform = process.platform;
    let cmd = '';
    switch (platform) {
        case 'win32' : cmd = `tasklist`; break;
        case 'darwin' : cmd = `ps -ax | grep ${query}`; break;
        case 'linux' : cmd = `ps -A`; break;
        default: break;
    }
    require('child_process').exec(cmd, (err, stdout, stderr) => {
        cb(stdout.toLowerCase().indexOf(query.toLowerCase()));
    });
}

function findVal(object, key) {
    var value;
    Object.keys(object).some(function(k) {
        if (k === key) {
            value = object[k];
            return true;
        }
        if (object[k] && typeof object[k] === 'object') {
            value = findVal(object[k], key);
            return value !== undefined;
        }
    });
    return value;
}

function getBattleNetGames() {
  getBattleNetInfo(function(data) {
    var battleNetPath = findVal(data, 'Path');
    var battleNetGamesDir = findVal(data, 'DefaultInstallPath').replace("/", "\\") + "\\";
    var battleNetDirectories = main.getDirectories(battleNetGamesDir.toString());
    var battleNetGames = [];
    for (var x = 0; x < battleNetDirectories.length; x++) {
      if (fs.existsSync(battleNetGamesDir + battleNetDirectories[x] + "\\BlizzardBrowser")) {
        var gameInfo = {
          name: battleNetDirectories[x].toString(),
          path: battleNetGamesDir + battleNetDirectories[x].toString()
        }
        battleNetGames.push(gameInfo);
      }
    }

    for (var x = 0; x < battleNetGames.length; x++) {
      var launchCode = "Pro";
      switch (battleNetGames[x].title) {
        case "Diablo 3":
          launchCode = "D3";
          break;
        case "Destiny 2":
          launchCode = "DST2";
          break;
        case "Heroes of the Storm":
          launchCode = "HERO";
          break;
        case "Starcraft":
          launchCode = "S1";
          break;
        case "Starcraft 2":
          launchCode = "S2";
          break;
        case "World of Warcraft":
          launchCode = "WOW";
          break;
        case "Hearthstone":
          launchCode = "WTCG";
          break;
        case "Call of Duty Black Ops 4":
          launchCode = "VIPR";
          break;
        case "Overwatch":
          launchCode = "Pro";
          break;
      }
      var data = {
        title: battleNetGames[x].name,
        dir: battleNetGames[x].path + "\\",
        launch: '*' + battleNetPath + '\\Battle.net.exe* --exec=*launch '  + launchCode + '*',
        noArt: true,
        vendor: "battlenet",
        remove: false,
        rawtitle: battleNetGames[x].name
      }

      main.getCoverArtByName(battleNetGames[x].name, function(coverArt) {
        if (coverArt == undefined) {
          console.groupCollapsed("Cover Error")
          console.log("Unable to find cover art for game: " + battleNetGames[x].name);
          console.groupEnd();
          data.noArt = true;
        } else {
          data.noArt = false;
        }
        data.cover = coverArt;
        main.addGame(data);
      });
    }
  });
}

function getBattleNetInfo(callback) {
  isRunning('Battle.net.exe', (status) => {
      if (status == false) {
        open("battlenet://");
      }
      var battleConfig = fs.readFileSync(process.env.APPDATA.replace("\\", "\\\\") + "\\Battle.net\\Battle.net.config");
      battleConfig = JSON.parse(battleConfig.toString());
      callback(battleConfig);

  });
}
