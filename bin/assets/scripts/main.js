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
  default: {
    gameDataFormat: {
      "title": "DEFAULT GAME",
      "dir": "NONE",
      "cover": "",
      "launch": "steam://run/310",
      "favorite": false,
      "noArt": true,
      "vendor": "apex"
    }
  },
  temp: {
    gameStorage: []
  },
  settings: {
    favorites: [],
    games: []
  },
  intervals: {
    _process: null
  },
  setup: function(cb) {
    if (!fs.existsSync("./userStorage/")) {
      fs.mkdirSync("./userStorage/");
    }
    if (!fs.existsSync("./userStorage/art/")) {
      fs.mkdirSync("./userStorage/art/");
    }
    if (!fs.existsSync("settings.json")) {
      fs.writeFile('settings.json', JSON.stringify(main.settings, null, 2), 'utf8');
    }
    cb();
  },
  loadSettings: function(cb) {
    this.settings = JSON.parse(fs.readFileSync('settings.json'));
    cb();
  },
  saveSettings: function(cb) {
    fs.writeFileSync('settings.json', JSON.stringify(main.settings, null, 2), 'utf8');
    cb();
  },
  init: function() {
    main.setup(function() {
      main.loadSettings(function() {
        main.loadGames();
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
      callback('./userStorage/art/' + appId + '.png')
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
      callback('./userStorage/art/' + name + '.png')
    } else {
      SGDBClient.searchGame(name)
        .then((output) => {
          var gameArtData = output.find(o => o.name === name);
          if (gameArtData == undefined) {
            gameArtData = output[0]
          }
          SGDBClient.getGrids({type: 'game', id: gameArtData.id, styles: ['blurred', 'material', "alternate", "no_logo"]})
            .then((output) => {
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
  loadGames: function() {
    for (var x = 0; x < Object.keys(main.settings.games).length; x++) {
      var game =  main.settings.games[Object.keys(main.settings.games)[x]];
      main.addGame(game)
    }
  },
  editGame: function(name) {
    main.settings.games[name].cover = $('[data-gameeditor="thumbnail"]').css('background-image').replace('url(','').replace(')','').replace(/\"/gi, "");
    main.settings.games[name].title = $('[data-gameeditor="name"]').val();
    main.settings.games[name].launch = $('[data-gameeditor="launch"]').val();

    $('.game-card[data-name="' + name + '"] .card-title span').text(main.settings.games[name].title);
    $('.game-card[data-name="' + name + '"]').attr('data-launch', main.settings.games[name].launch);
    $('.game-card[data-name="' + name + '"] img').attr('src', './assets/images/vendor/' + main.settings.games[name].vendor + '.png');
  },
  addGame: function(data) {
    var gameName = data.title;
    if (typeof main.settings.games[data.title].remove !== undefined && main.settings.games[data.title].remove == true) { return; }
    if (main.temp.gameStorage[data.title] !== undefined) {
      return;
    }
    if (main.settings.games[data.title] === undefined) {
      main.settings.games[data.title] = data;
    } else {
      data = main.settings.games[data.title];
    }
    var noArt = (data.noArt == true) ? "<span class=\"no-art\">" + data.title + "</span>" : "";
    var favorite = (main.settings.favorites[data.title] == true) ? " favorite" : "";

    if (data.noArt == true) { data.cover = "linear-gradient(to right, #2b5876, #4e4376);" }
    var $ele = '\
  <div data-launch="' + data.launch + '" data-vendor="' + data.vendor + '" data-name="' + gameName + '" class="game-card' + favorite + '" style="background-image: ' + data.cover + '">\
   ' + noArt + '\
   <img src="./assets/images/vendor/' + data.vendor + '.png" />\
   <div class="card-title">\
    <span>' + data.title + '</span>\
   </div>\
  </div>\
  ';
    $($ele).appendTo('.library');
    main.temp.gameStorage[data.title] = true;
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
      $('.game-editor').addClass('active editing');
      $('.container').addClass('dim');

      $('[data-gameeditor="thumbnail"]').attr('style', "background-image: url('" + main.settings.games[name].cover + "');'");
      $('[data-gameeditor="name"]').val(main.settings.games[name].title);
      $('[data-gameeditor="launch"]').val(main.settings.games[name].launch);
      break;
    case "remove":
      main.settings.games[name].remove = true;
      $('.game-card[data-context]').fadeOut();
      break;
  }
});

$("body").on("click", "[data-action]", function() {
  var action = $(this).data('action');

  switch (action) {
    case "addnewgame":
      $('.game-editor').addClass('active');
      $('.container').addClass('dim');

      $('[data-gameeditor="thumbnail"]').attr('style', "background-image: url('assets/images/thumbnail.jpg');");
      $('[data-gameeditor="name"]').val("");
      $('[data-gameeditor="launch"]').val("");
      break;
  }
});

$('body').on('click', '.editor-thumbnail', function() {
  $('#thumbnailDialog').trigger('click');
});

$('body').on('change', '#thumbnailDialog', function() {
  var data = $('#thumbnailDialog')[0].files[0].path.replace(/\\/g, '/');

  if (data !== null) {
    var name = data.split('/').pop();
    console.log(data.toString());
    console.log('url(./userStorage/art/' + name.toString() + ')');
    fs.copyFileSync(data.toString(), 'userStorage/art/' + name.toString());
    $('.editor-thumbnail').attr('style', "background-image: url('/userStorage/art/" + name.toString() + "');");
  }
});

$('body').on('click', '[data-gameeditor="submit"]', function() {
  if ($(this).parent().parent().hasClass("editing")) {
    var name = $('.game-card[data-context]').data('name');
    main.editGame(name);
  } else {
    var data = main.default.gameDataFormat;
    data.cover = $('[data-gameeditor="thumbnail"]').css('background-image').replace('url(','').replace(')','').replace(/\"/gi, "");
    data.title = $('[data-gameeditor="name"]').val();
    data.launch = $('[data-gameeditor="launch"]').val();
    if ($('[data-gameeditor="thumbnail"]').css('background-image').replace('url(','').replace(')','').replace(/\"/gi, "").indexOf('assets/images/thumbnail.jpg') == -1) {
      data.noArt = false;
    }
    main.addGame(data);
  }
  $('.game-editor.active').removeClass('active editing');
  $('.container').removeClass('dim');
});

$('body').on('keypress', '[data-gameeditor="name"]', '[data-gameeditor="launch"]', function(e) {
  if (e.which === 13) {
    console.log($(this).parent().parent().parent())
    if ($(this).parent().parent().parent().hasClass("editing")) {
      var name = $('.game-card[data-context]').data('name');
      main.editGame(name);
    } else {
      var data = main.default.gameDataFormat;
      data.cover = $('[data-gameeditor="thumbnail"]').css('background-image').replace('url(','').replace(')','').replace(/\"/gi, "");
      data.title = $('[data-gameeditor="name"]').val();
      data.launch = $('[data-gameeditor="launch"]').val();
      main.addGame(data);
    }
    $('.game-editor.active').removeClass('active editing');
    $('.container').removeClass('dim');
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
