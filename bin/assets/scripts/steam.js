function readSteamAcf(file) {
  let rawacf = fs.readFileSync(file);
  let acfdata = VDF.parse(rawacf.toString());
  acfdata = acfdata.AppState;
  var data = {
    title: acfdata.name,
    dir: acfdata.installdir,
    launch: "steam://run/" + acfdata.appid,
    favorite: false,
    vendor: "steam"
  }
  main.getCoverArtById(acfdata.appid, function(coverArt) {
    if (coverArt == undefined) {
      console.groupCollapsed("Cover Error")
      console.log("Unable to find cover art for game: " + acfdata.appid);
      console.log(acfdata.title);
      console.groupEnd();
      data.noArt = true;
    } else {
      coverArt = "url(" + coverArt + ");";
      data.noArt = false;
    }
    data.cover = coverArt;
    main.addGame(data);
  });
}

function getSteamLibraryFolders() {
  let rawvdf = fs.readFileSync('C:\\Program Files (x86)\\Steam\\steamapps\\libraryfolders.vdf');
  let vdfdata = VDF.parse(rawvdf.toString());
  if (vdfdata.LibraryFolders[1] !== undefined) {
    // Alternate Library Set Up
    var files = main.getFilesByType(vdfdata.LibraryFolders[1] + "\\steamapps", /\.acf$/, function(file) {
      readSteamAcf(file);
    });
  }
}

function readSteamGames() {
  getSteamLibraryFolders();
}
