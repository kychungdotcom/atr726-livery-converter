/*
Reference:
https://jaketrent.com/post/select-directory-in-electron
https://stackoverflow.com/questions/44391448/electron-require-is-not-defined/55908510
*/
const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
var currentBasePath;

app.whenReady().then(() => {

  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 512,
    titleBarStyle: 'hidden',
    defaultEncoding: 'utf8',
    resizable: false,
    maximizable: false,
    center: true,
    removeMenu: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      enableRemoteModule: false,
      contextIsolation: true
    }
  });

  mainWindow.removeMenu(true);

  mainWindow.loadFile('index.html');

  //mainWindow.webContents.openDevTools();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  ipcMain.on('toMain', (event, args) => {
    if (args['directoryConfirmed'] && (args['directoryConfirmed'] === true)) {
      console.log('Confirm directory selected: ' + currentBasePath);
      mainWindow.webContents.send('fromMain', {
        convertStatus: 'Verifying...'
      });
      mainWindow.closable = false;
      numDone = doConversion(currentBasePath, mainWindow);
      mainWindow.webContents.send('fromMain', {
        done: numDone,
        convertStatus: numDone + ' liveries converted.'
      });
      mainWindow.closable = true;
    }
  });

  ipcMain.on('select-dirs', async (event, arg) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    if (Array.isArray(result.filePaths) && (result.filePaths.length > 0)) {
      console.log('Directory selected: ' + result.filePaths)
      mainWindow.webContents.send("fromMain", {
        basePath: result.filePaths[0]
      });
      currentBasePath = result.filePaths[0];
    }
  });

});

function doConversion(currentBasePath, mainWindow) {
  try {
    let numDone = 0;
    let filesInbasePath = fs.readdirSync(currentBasePath);
    if (filesInbasePath) {
      var maniFestJSONPath = path.join(currentBasePath, 'manifest.json');
      var layoutJSONPath = path.join(currentBasePath, 'layout.json');
      var simObjectsPath = path.join(currentBasePath, 'SimObjects', 'Airplanes');
      var simObjects = fs.readdirSync(simObjectsPath);
    }
    if (simObjects.length) {
      console.log(simObjects);
      for (aircraftFolder of simObjects) {
        console.log(aircraftFolder);
        var variationPath = path.join(simObjectsPath, aircraftFolder);
        if (fs.lstatSync(variationPath).isDirectory()) {
          console.log(variationPath);
          var simObjects = fs.readdirSync(variationPath);
          console.log(simObjects);
          for (item of simObjects) {
            console.log('Item: ' + item);
            if (item.match(/model/i)) {
              var modelFolderPath = path.join(variationPath, item);
              console.log(modelFolderPath);
              var modelCFGPath = path.join(modelFolderPath, 'model.cfg');
              console.log(modelCFGPath);
              if (!fs.existsSync(modelCFGPath)) {
                continue;
              }
            }
            if (item.match(/texture/i)) {
              var textureFolder = item;
              var textureFolderPath = path.join(variationPath, item);
              console.log(textureFolderPath);
              var textureCFGPath = path.join(textureFolderPath, 'texture.cfg');
              console.log(textureCFGPath);
              if (!fs.existsSync(textureCFGPath)) {
                continue;
              }
            }
            if (item.match(/aircraft\.cfg/i)) {
              var aircraftCFGPath = path.join(variationPath, item);
              console.log(aircraftCFGPath);
              if (!fs.existsSync(aircraftCFGPath)) {
                continue;
              }
            }
          }
          var aircraftCFGContent = fs.readFileSync(aircraftCFGPath, 'utf8');
          var textureCFGContent = fs.readFileSync(textureCFGPath, 'utf8');
          var textureFiles = fs.readdirSync(textureFolderPath);
          var modelCFGContent = fs.readFileSync(modelCFGPath, 'utf8');
          if (
            aircraftCFGContent.match(/atr725/i) &&
            textureCFGContent.match(/atr725/i) &&
            modelCFGContent.match(/atr725/i) &&
            (textureFiles.indexOf('vcatr_eng_t.dds') >=0) &&
            (textureFiles.indexOf('vcatr_fuse_t.dds') >=0) &&
            (textureFiles.indexOf('vcatr_fusetail_t.dds') >=0) &&
            (textureFiles.indexOf('vcatr_wings_t.dds') >=0)
          ) {
            console.log('Validated, conversion begins...');
            aircraftCFGContent = aircraftCFGContent.replace(/base_container([\s\S]+)atr725([\s\S]+?)\n/i, 'base_container = "..\\atr726"\n');
            console.log(aircraftCFGContent);
            fs.writeFileSync(aircraftCFGPath, aircraftCFGContent, 'utf8');
            modelCFGContent = modelCFGContent.replace(/\/atr725\/model\/Vcol_atr725\.mdl/i, '\/atr726/model/Vcol_atr725.xml').replace(/\/atr725\/model\/CJ4_Cockpit\.xml/i, '\/atr726/model/KINGAIR_350I_interior.xml');
            console.log(modelCFGContent);
            fs.writeFileSync(modelCFGPath, modelCFGContent, 'utf8');
            textureCFGContent = textureCFGContent.replace(/fallback\.4([\s\S]+?)atr725([\s\S]+?)$/i, 'fallback.4=..\\..\\atr726\\texture\nfallback.5=..\\..\\Asobo_KingAir350\\texture');
            console.log(textureCFGContent);
            fs.writeFileSync(textureCFGPath, textureCFGContent, 'utf8');
          }

          var newTextureFileEntry =[];

          for (file of textureFiles) {
            var isTexture = file.match(/vcatr_\S+_t.dds/i);
            if (isTexture && isTexture.length) {
              var oldFileName = file;
              var newFileName = isTexture[0].replace(/\.dds$/i, '.PNG.DDS').toUpperCase();
              fs.renameSync(path.join(textureFolderPath, oldFileName), path.join(textureFolderPath, newFileName));
              var textureStat = fs.statSync(path.join(textureFolderPath, newFileName));
              var textureLastModifedDate = parseInt((textureStat.mtimeMs + 11644430400000) * 10000);
              var textureSize = textureStat.size;
              var textureJSON = {
                "Version": 2,
                "SourceFileDate": textureLastModifedDate,
                "Flags": ["FL_BITMAP_COMPRESSION", "FL_BITMAP_MIPMAP"],
              }
              if (file.match(/_eng_/i)) {
                textureJSON.HasTransp = true;
              }
              fs.writeFileSync(path.join(textureFolderPath, (newFileName + '.JSON')), JSON.stringify(textureJSON, null, '\t'), 'utf8');
              newTextureFileEntry.push({
                "path": 'SimObjects/Airplanes/' + aircraftFolder + '/' + textureFolder + '/' + newFileName + '.JSON',
                "size": textureSize,
                "date": textureLastModifedDate
              });
            }
          }

        }

        var maniFestJSONContent = fs.readFileSync(maniFestJSONPath, 'utf8');
        var maniFestJSONObj = JSON.parse(maniFestJSONContent);
        maniFestJSONObj.minimum_game_version = "1.14.6";
        maniFestJSONObj.dependencies = [{
          "name": "ATR 72-600",
          "package_version": "0.5.0"
        }];
        fs.writeFileSync(maniFestJSONPath, JSON.stringify(maniFestJSONObj, null, '\t'));

        var layoutJSONContent = fs.readFileSync(layoutJSONPath, 'utf8');
        layoutJSONContent = layoutJSONContent.replace(/_t\.dds/gi, '_t\.PNG\.DDS');
        var layoutJSONObj = JSON.parse(layoutJSONContent);
        layoutJSONObj.content = layoutJSONObj.content.concat(newTextureFileEntry);
        fs.writeFileSync(layoutJSONPath, JSON.stringify(layoutJSONObj, null, '\t'), 'utf8');
        numDone++;
      }
    }
    return numDone;
  } catch (err) {
    return 0;
  }
}
