$('#title').text(require('./package.json').window.title)

const fs = require('fs');
const path = require('path');
const open = require('open');
const https = require('https');
const SGDB = require('steamgriddb');
const convert = require('xml-js');
const privateKey = require('./key.json');

const SGDBClient = new SGDB(privateKey.key);
var win = nw.Window.get();
var winMax = false;

var main = {
  dummy: {
    gameDataFormat: {
      "title": "Game Human Name",
      "dir": "C:/Game/Game.exe",
      "cover": "C:/Game/cover.png",
      "launch": "steam://run/appid",
      "favorite": true,
      "noArt": false
    }
  },
  settings: {
    favorites: [],
    games: []
  },
  intervals: {
    _process: null
  },
  setup: function(callback) {
    if (!fs.existsSync("./userStorage/")) {
      fs.mkdirSync("./userStorage/");
    }
    if (!fs.existsSync("./userStorage/art/")) {
      fs.mkdirSync("./userStorage/art/");
    }
    if (!fs.existsSync("settings.json")) {
      fs.writeFile('settings.json', JSON.stringify(main.settings, null, 2), 'utf8');
    }
    callback();
  },
  loadSettings: function(callback) {
    this.settings = JSON.parse(fs.readFileSync('settings.json'));
    callback();
  },
  saveSettings: function(callback) {
    fs.writeFile('settings.json', JSON.stringify(main.settings, null, 2), 'utf8');
    callback();
  },
  init: function() {
    this.setup(function() {
      main.loadSettings(function() {
        readSteamGames();
        getOriginGames();
        getBattleNetGames();
      });
    });
  },
  getDirectories: function(dir) {
    return fs.readdirSync(dir).filter(function (file) {
      return fs.statSync(dir+'/'+file).isDirectory();
    });
  },
  getFilesByType: function(directory, type, callback) {
    if (!fs.existsSync(directory)) {
      console.log("Unknown Directory: ", directory);
      return;
    }

    var files = fs.readdirSync(directory);
    for (var i = 0; i < files.length; i++) {
      var filename = path.join(directory, files[i]);
      var stat = fs.lstatSync(filename);
      if (stat.isDirectory()) {
        //this.getFilesByType(filename, type, callback);
      } else if (type.test(filename)) callback(filename.replace(/\\/g, "/"));
    };
  },
  getCoverArtById: function(appId, callback) {
    if (fs.existsSync('./userStorage/art/' + appId + '.png')) {
      callback('\'./userStorage/art/' + appId + '.png\'')
    } else {
      SGDBClient.getGridsBySteamAppId(appId, ['blurred', 'material', "alternate", "no_logo"])
        .then((output) => {
          if (output[0] == undefined) {
            callback(undefined);
          } else {
            var file = fs.createWriteStream('./userStorage/art/' + appId + '.png');
            var request = https.get(output[0].url, function(response) {
              response.pipe(file);
            });
            callback(output[0].url);
          }
        })
        .catch((err) => {
          console.log(err);
          console.log("For game: " + appId)
          callback(undefined);
        });
    }
  },
  getCoverArtByName: function(name, callback) {
    if (fs.existsSync('./userStorage/art/' + name + '.png')) {
      callback('\'./userStorage/art/' + name + '.png\'')
    } else {
      SGDBClient.searchGame(name)
        .then((output) => {
          var gameArtData = output.find(o => o.name === name);
          if (gameArtData == undefined) {
            gameArtData = output[0]
          }
          console.log(output)
          SGDBClient.getGrids({type: 'game', id: gameArtData.id, styles: ['blurred', 'material', "alternate", "no_logo"]})
            .then((output) => {
              console.log(gameArtData)
              if (output[0] == undefined) {
                callback(undefined);
              } else {
                var file = fs.createWriteStream('./userStorage/art/' + name + '.png');
                var request = https.get(output[0].url, function(response) {
                  response.pipe(file);
                });
                callback(output[0].url);
            }
          })
          .catch((err) => {
            console.log(err);
            console.log("For game: " + gameArtData.id)
            callback(undefined);
          });
        })
        .catch((err) => {
            console.log(err);
        });
      }
  },
  toggleFavorite: function(name) {
    main.settings.favorites[name] = !main.settings.favorites[name];
    if (main.settings.favorites[name] == false) {
      $('[data-name="' + name + '"]').removeClass('favorite');
    } else {
      $('[data-name="' + name + '"]').addClass('favorite');
    }
  },
  editGame: function(name) {
    $('.game-editor').addClass('active');
    $('.container').addClass('dim');
  },
  addGame: function(data) {
    if (main.settings.games[data.title] === undefined) {
      main.settings.games[data.title] = data;
    }

    if (main.settings.games[data.title].remove == true) {
      return false;
    }

    var noArt = (data.noArt == true) ? "<span class=\"no-art\">" + data.title + "</span>" : "";
    var favorite = (main.settings.favorites[data.title] == true) ? " favorite" : "";

    if (data.noArt == true) { data.cover = "linear-gradient(to right, #2b5876, #4e4376);" }
    var $ele = '\
  <div data-launch="' + data.launch + '" data-vendor="' + data.vendor + '" data-name="' + data.title + '" class="game-card' + favorite + '" style="background-image: ' + data.cover + '">\
   ' + noArt + '\
   <img src="./assets/images/vendor/' + data.vendor + '.png" />\
   <div class="card-title">\
    <span>' + data.title + '</span>\
   </div>\
  </div>\
  ';
    if (main.settings.favorites[data.title] === undefined) { main.settings.favorites[data.title] = false }
    if (main.settings.favorites[data.title] === false) {
      $($ele).appendTo('.library');
    } else {
      $($ele).appendTo('.library');
    }
    //$($ele).appendTo('.library .favorites');
  }
}

$('.navigation').on('click', '[data-tab]', function() {
  var tab = $(this).data('tab');
  $('.navigation a.active').removeClass('active');
  $(this).addClass('active');
  $('.page.active').removeClass('active');
  $('[data-page="' + tab + '"]').addClass('active')
});

$('.library').on('click', '[data-launch]', function() {
  var launchCode = $(this).data('launch').replace(/\*/g, '"');
  var name = $(this).data('name');
  var vendor = $(this).data('vendor');
  $('.loader h2').text("Starting " + name + ", please wait...");
  if (vendor == "battlenet") { require('node-cmd').run(launchCode) } else { open(launchCode) }
  $('.container').addClass('launching');
  setTimeout(function() {
    main.intervals._process = setInterval(function() {
      require('child_process').exec('tasklist /FI "windowtitle eq ' + name + '" /fo csv /nh', (err, stdout, stderr) => {
        var processData = stdout.toString().split(",");
        if (stdout.toString().indexOf("No tasks are running") == -1) {
          $('.loader h2').text(processData[0].replace(/["']/g, "") + ' running with PID: ' + processData[1].replace(/["']/g, ""));
        } else {
          $('.container').removeClass('launching');
          clearInterval(main.intervals._process);
        }
      });
    }, 3000);
  }, 10000)
});

$('[data-window="close"]').click(function() {
  nw.App.closeAllWindows();
});

$('[data-window="size"]').click(function() {
  if (winMax == true) {
    win.restore();
    winMax = false;
  } else {
    win.maximize();
    winMax = true;
  }
});

$('[data-window="minimize"]').click(function() {
  win.minimize();
});

win.on('close', function() {
  main.saveSettings(function() {
    nw.App.quit();
  });
});

$("body").on("contextmenu", ".game-card", function(e) {
  $('.game-card[data-context]').removeAttr('data-context');
  $(this).attr('data-context', '');
  $('.context-game-card').css({
    opacity: 1,
    left: e.pageX,
    top: e.pageY,
    "pointer-events": "auto"
  });
  return false;
});

$("body").on("contextmenu", ".context", function(e) {
  return false;
});

$("body").on("click", function(e) {
  $('.context').css({
    opacity: 0,
    "pointer-events": "none"
  });
});

$("body").on('click', '.dimmer', function() {
  $('.game-editor.active').removeClass('active');
  $('.container').removeClass('dim');
});

$("body").on("click", "[data-gameaction]", function() {
  var action = $(this).data('gameaction');
  var name = $('.game-card[data-context]').data('name');
  switch (action) {
    case "favorite":
      main.toggleFavorite(name);
      break;
    case "edit":
      main.editGame(name)
      break;
  }
});

$(document).ready(function() {
  var backgrounds = fs.readdirSync('./assets/images/backgrounds/');
  var chosenFile = backgrounds[Math.floor(Math.random() * backgrounds.length)];
  $('.container').css("background-image", "var(--gradient-1-o), url('../assets/images/backgrounds/" + chosenFile + "')");
  setTimeout(function() {
    $('.container').removeClass('launching');
  }, 1000);
  main.init();
});