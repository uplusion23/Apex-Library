function getUplayGames() {
  require('child_process').exec('powershell -command "Get-ChildItem -Path HKLM:\\SOFTWARE\\WOW6432Node\\Ubisoft\\Launcher\\Installs\\ | Select-Object Name | Format-Table -HideTableHeaders"', (err, stdout, stderr) => {
      var installed = stdout.replace(/[\r\n]+/g, "\n").split('\n');
      installed.shift();
      installed.pop();
      var table = [];
      for (var x = 0; x < installed.length; x++) {
        require('child_process').exec('powershell -command "Get-ItemProperty -Path ' + installed[x].replace('HKEY_LOCAL_MACHINE', 'HKLM:') + ' | Select-Object InstallDir,PSChildName | ConvertTo-Csv -NoType | Select -Skip 1"', (err, stdout, stderr) => {
          var psData = stdout.replace(/[\r\n]+/g, "").replace(/"/g, '').split(',');
          var data = {
            title: path.basename(psData[0]).replace(/\//g, ""),
            dir: psData[0],
            launch: "uplay://launch/" + psData[1] + "/0",
            noArt: true,
            vendor: "uplay",
            remove: false,
            rawtitle: path.basename(psData[0]).replace(/\//g, "")
          }
          main.getCoverArtByName(data.rawtitle, function(coverArt) {
            if (coverArt == undefined) {
              console.groupCollapsed("Cover Error")
              console.log("Unable to find cover art for game: " + data.rawtitle);
              console.groupEnd();
              data.noArt = true;
            } else {
              data.noArt = false;
            }
            data.cover = coverArt;
            main.addGame(data);
          });
        });
      }
  });
}
