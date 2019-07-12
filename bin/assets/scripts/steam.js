var steamLocation = "C:\\Program Files (x86)\\Steam\\steamapps\\";

function readSteamAcf(file, rootPath) {
  let rawacf = fs.readFileSync(file);
  let acfdata = VDF.parse(rawacf.toString());
  acfdata = acfdata.AppState;
  if (acfdata.name == "SteamVR" || acfdata.name == "Steamworks Common Redistributables") {
    return;
  }
  var data = {
    title: acfdata.name,
    dir: rootPath + acfdata.installdir + "\\",
    launch: "steam://run/" + acfdata.appid,
    vendor: "steam",
    remove: false,
    rawtitle: acfdata.name,
    category: "default"
  }
  main.getCoverArtById(acfdata.appid, function(coverArt) {
    if (coverArt == undefined) {
      console.groupCollapsed("Cover Error")
      console.log("Unable to find cover art for game: " + acfdata.appid);
      console.log(acfdata.title);
      console.groupEnd();
      data.noArt = true;
    } else {
      data.noArt = false;
    }
    data.cover = coverArt;
    main.addGame(data);
  });
}

function getSteamLibraryFolders() {
  let rawvdf = fs.readFileSync(steamLocation + 'libraryfolders.vdf');
  let vdfdata = VDF.parse(rawvdf.toString());
  if (vdfdata.LibraryFolders[1] !== undefined) {
    // Alternate Library Set Up
    var lib1files = main.getFilesByType(vdfdata.LibraryFolders[1] + "\\steamapps", /\.acf$/, function(file) {
      readSteamAcf(file, vdfdata.LibraryFolders[1] + "\\steamapps\\");
    });
    var gamefiles = main.getFilesByType(steamLocation, /\.acf$/, function(file) {
      readSteamAcf(file, steamLocation);
    });
  }
}

function readSteamGames() {
  getSteamLibraryFolders();
}
