/////////////////////////////
// これまで書いてきた
// スプレッドシートのデータを取り扱う処理
// TwitterClient.pickUpTweetInOrder('シート1') で実行できます
/////////////////////////////


/**
* ツイートを順番に選択する処理
* 処理の中で前回の番号を保持していくことは出来ないので
* 投稿された回数をシートに保存しておき、一番投稿された回数が少ない記事を次の記事にする
*
* @return {String} 
**/
function pickUpTweetInOrder(sheetName = 'シート1') {
  const sheetData = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const titleRow = 1; // 『投稿内容』とか書いている部分の行数
  const startRow = 1 + titleRow; // 1行目は『投稿内容』とか書いているので2行目から
  const startCol = 1;
  const endRow = sheetData.getLastRow() - titleRow; // 最後の行まで（2行目から始まっているので-1している）
  const endCol = 2; // 『投稿回数』の列までなので2列目まで
  
  // 投稿を一括で取得する
  const cells = sheetData.getRange(startRow, startCol, endRow, endCol).getValues();
  
  // ちなみにcellsの中身は
  // [ [ '投稿内容', '投稿回数'] ,  [ '投稿内容', '投稿回数'] ,  [ '投稿内容', '投稿回数'] ,....,] 
  // という形式になっている
 // Logger.log(cells);
  
  let postData = cells[0]; // postData = [ '投稿内容', '投稿回数'] なので postData[0] => 投稿内容, postData[1] => 投稿回数 
  let row = 1 // 行番号（選ばれたらその行の投稿された回数を+1するために持っておく）
  for (let i = 0, il = cells.length; i < il; i++ ) {
    // 投稿回数が少なかったら更新（回数が同じであればそのまま）
    if (cells[i][1] < postData[1]) {
      postData = cells[i]
      row = 1 + i // 行は1から始まるので+1して保存しておく
    }
  }
  const postMessage = postData[0];
  
  if (postMessage == '') {
    Logger.log('投稿内容を上手く取得できませんでした。以下のシートを参考にしてください。')
    Logger.log('https://docs.google.com/spreadsheets/d/1Xr1G4FTglcE68j7eylcrwJgQtzfN0AB3K7EKZMIFQ8I/edit#gid=0')
    return "";
  }
  
  // 投稿する内容の投稿回数の部分のセルだけ取得して、+1して更新する
  const updateCell = sheetData.getRange(row + titleRow, 2, 1, 1);
  updateCell.setValue(postData[1]+1);
  
  return postMessage;
}


/**
* ツイートをランダムに選択する処理
*
* @return {String} 
**/
function pickUpTweetRandom(sheetName = 'シート1') {
  const sheetData = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const titleRow = 1; // 『投稿内容』とか書いている部分の行数
  const startRow = 1 + titleRow; // 1行目は『投稿内容』とか書いているので2行目から
  const startCol = 1;
  const endRow = sheetData.getLastRow() - titleRow; // 最後の行まで（2行目から始まっているので-1している）
  const endCol = 3; // 『前回の投稿』の列までなので3列目まで
  
  // 投稿を一括で取得する
  const cells = sheetData.getRange(startRow, startCol, endRow, endCol).getValues();  
  
  // 重みの合計を出す
  let weightSum = 0;
  for (let i = 0, il = cells.length; i < il; i++ ) {
    // 前回の投稿を除外する
    const updateCell = sheetData.getRange(i + startRow, endCol, 1, 1);
    updateCell.setValue(false);
    if (typeof cells[i][2] != 'Boolean' && cells[i][2]) {
      continue
    }
    weightSum += cells[i][1];
  }
  
  let randomValue = weightSum * Math.random();
  let postMessage = "";
  for (let i = 0, il = cells.length; i < il; i++ ) {
    // 前回の投稿を除外する
    if (typeof cells[i][2] != 'Boolean' && cells[i][2]) {
      continue
    }
    randomValue -= cells[i][1];
    if (randomValue < 0) {
      postMessage = cells[i][0];
      // 投稿したことを記録する
      const updateCell = sheetData.getRange(i + startRow, endCol, 1, 1);
      updateCell.setValue(true);
      break;
    }
  }
  
  if (postMessage == '') {
    Logger.log('投稿内容を上手く取得できませんでした。以下のシートを参考にしてください。')
    Logger.log('https://docs.google.com/spreadsheets/d/1Xr1G4FTglcE68j7eylcrwJgQtzfN0AB3K7EKZMIFQ8I/edit#gid=1886190122')
    return "";
  }
  return postMessage;
}

/**
* ツイート情報を順番に取得処理
* @return {Object} 
**/
function pickUpTweetDataInOrder(sheetName = 'シート1') {
  const sheetData = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const titleRow = 1; // 『投稿内容』とか書いている部分の行数
  const startRow = 1 + titleRow; // 1行目は『投稿内容』とか書いているので2行目から
  const startCol = 1;
  const endRow = sheetData.getLastRow() - titleRow; // 最後の行まで（2行目から始まっているので-1している）
  const endCol = 6; // 『Google Drive URL_4』の列までなので6列目まで

  // 投稿を一括で取得する
  const cells = sheetData.getRange(startRow, startCol, endRow, endCol).getValues();
  
  // ちなみにcellsの中身は
  // [ [ '投稿内容', '投稿回数', '画像URL_1', '画像URL_2'...] ,  [ '投稿内容', '投稿回数', '画像URL_1', '画像URL_2'...] ,....,] 
  // という形式になっている
  // Logger.log(cells);
  
  let targetData = cells[0]; // targetData = [ '投稿内容', '投稿回数'] なので targetData[0] => 投稿内容, targetData[1] => 投稿回数 
  let row = 1 // 行番号（選ばれたらその行の投稿された回数を+1するために持っておく）
  for (var i = 0, il = cells.length; i < il; i++ ) {
    if (cells[i][0] === '') {
      continue;
    }
    // cells[i][1], targetData[1] → 投稿回数の比較
    // 投稿回数が少なかったら更新（回数が同じであればそのまま）
    if (cells[i][1] < targetData[1]) {
      targetData = cells[i]
      row = 1 + i // 行は1から始まるので+1して保存しておく
    }
  }
  
  if (typeof targetData[0] === 'undefined' || targetData[0] == '') {
    Logger.log('投稿内容を上手く取得できませんでした。以下のシートを参考にしてください。')
    Logger.log('https://docs.google.com/spreadsheets/d/1Xr1G4FTglcE68j7eylcrwJgQtzfN0AB3K7EKZMIFQ8I/edit#gid=98578108')
    return "";
  }
  
  // 投稿する内容の投稿回数の部分のセルだけ取得して、+1して更新する
  const updateCell = sheetData.getRange(row + titleRow, 2, 1, 1);
  updateCell.setValue(targetData[1]+1);
  
  const fileIdArray = []
  for (let i = 2; i < endCol; i++) {
    if (targetData[i] !== '') {
      const driveUrl = targetData[i];
      if (driveUrl.indexOf('https://drive.google.com/file/d/') === -1) {
        // 不正なURL
        Logger.warning('利用可能なURLではありませんでした。> ' + driveUrl + '\n\n以下の記事を参考にしてください\nhttps://belltree.life/twitter-google-drive/#toc4');
        continue;
      }
      let result = driveUrl.split('https://drive.google.com/file/d/')[1];
      result = result.split('/view')[0]; // /view が含まれていたら抜いておく
      fileIdArray.push(result)
    }
  }
 
  const postData = {
    message: targetData[0],
    fileIdArray: fileIdArray
  }
  
  return postData;
}

/**
* ツイート情報をランダムに取得する処理
*
* @return {String} 
**/
function pickUpTweetDataRandom(sheetName = 'シート1') {
  const sheetData = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const titleRow = 1; // 『投稿内容』とか書いている部分の行数
  const startRow = 1 + titleRow; // 1行目は『投稿内容』とか書いているので2行目から
  const startCol = 1;
  const endRow = sheetData.getLastRow() - titleRow; // 最後の行まで（2行目から始まっているので-1している）
  const flagCol = 3; // 前回投稿のフラグの位置
  const endCol = 7; // 『Google Drive URL_4』の列までなので7列目まで
  
  // 投稿を一括で取得する
  const cells = sheetData.getRange(startRow, startCol, endRow, endCol).getValues();  
  
  // 重みの合計を出す
  let weightSum = 0;
  for (let i = 0, il = cells.length; i < il; i++ ) {
    // 前回の投稿を除外する
    const updateCell = sheetData.getRange(i + startRow, flagCol, 1, 1);
    updateCell.setValue(false);
    if (typeof cells[i][2] != 'Boolean' && cells[i][2]) {
      continue
    }
    weightSum += cells[i][1];
  }
  
  let randomValue = weightSum * Math.random();
  let postMessage = "";
  let targetData = cells[0];
  for (let i = 0, il = cells.length; i < il; i++ ) {
    // 前回の投稿を除外する
    if (typeof cells[i][2] != 'Boolean' && cells[i][2]) {
      continue
    }
    randomValue -= cells[i][1];
    if (randomValue < 0) {
      postMessage = cells[i][0];
      targetData = cells[i]
      // 投稿したことを記録する
      const updateCell = sheetData.getRange(i + startRow, flagCol, 1, 1);
      updateCell.setValue(true);
      break;
    }
  }
  
  if (postMessage == '') {
    Logger.log('投稿内容を上手く取得できませんでした。以下のシートを参考にしてください。')
    Logger.log('https://docs.google.com/spreadsheets/d/1Xr1G4FTglcE68j7eylcrwJgQtzfN0AB3K7EKZMIFQ8I/edit#gid=1886190122')
    return "";
  }

  const fileIdArray = []
  for (let i = flagCol; i < endCol; i++) {
    if (targetData[i] !== '') {
      const driveUrl = targetData[i];
      if (driveUrl.indexOf('https://drive.google.com/file/d/') === -1) {
        // 不正なURL
        Logger.warning('利用可能なURLではありませんでした。> ' + driveUrl + '\n\n以下の記事を参考にしてください\nhttps://belltree.life/twitter-google-drive/#toc4');
        continue;
      }
      let result = driveUrl.split('https://drive.google.com/file/d/')[1];
      result = result.split('/view')[0]; // /view が含まれていたら抜いておく
      fileIdArray.push(result)
    }
  }
 
  const postData = {
    message: postMessage,
    fileIdArray: fileIdArray
  }

  return postData;
}


/**
* シートからツイートIDをまとめて取得してくる
*
* @return {String} 
**/
function pickupAllTweetLink(sheetName = 'シート1') {
  const sheetData = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const titleRow = 1; // 『投稿内容』とか書いている部分の行数
  const startRow = 1 + titleRow; // 1行目は『投稿内容』とか書いているので2行目から
  const startCol = 1;
  const endRow = sheetData.getLastRow() - titleRow; // 最後の行まで（2行目から始まっているので-1している）
  const endCol = 1; // 『前回の投稿』の列までなので1列目まで
  
  // 投稿を一括で取得する
  const cells = sheetData.getRange(startRow, startCol, endRow, endCol).getValues();  
  const tweetIds = []
  for (let i in cells) {
    const tweetId = convertFromUrlToTweetId(cells[i][0])
    tweetIds.push(tweetId)
  }
  if (tweetIds.length == 0) {
    Logger.log('投稿内容を上手く取得できませんでした。以下のシートを参考にしてください。')
    Logger.log('https://docs.google.com/spreadsheets/d/1Xr1G4FTglcE68j7eylcrwJgQtzfN0AB3K7EKZMIFQ8I/edit#gid=1056960065')
  }
  return tweetIds;
}

// URLからTweetIdを抽出する
function convertFromUrlToTweetId (url) {
  const tweetId = url.replace(/https:\/\/twitter.com\/.*\/status\//g , "")
  return tweetId
}

// ユーザー情報を書き込む
function getUserIdsFromSheet (sheetName = 'シート1') {
  const sheetData = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const titleRow = 1; // 『投稿内容』とか書いている部分の行数
  const startRow = 1 + titleRow; // 1行目は『投稿内容』とか書いているので2行目から
  const startCol = 1
  const endRow = sheetData.getLastRow() - titleRow
  const endCol = 1
  
  // 投稿を一括で取得する
  const cells = sheetData.getRange(startRow, startCol, endRow, endCol).getValues();  
  return cells
}


// ユーザー情報を書き込む
function writeFollowInfo (userInfo, followUserIds, followedUserIds, sheetName = 'シート1') {
  const sheetData = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName)
  const titleRow = 1 // 『投稿内容』とか書いている部分の行数
  const startRow = 1 + titleRow // 1行目は『投稿内容』とか書いているので2行目から
  const endRow = sheetData.getLastRow()
  const startCol = 1 // 1行目は『投稿内容』とか書いているので2行目から
  const endCol = 4
  const allCells = sheetData.getRange(startRow, startCol, endRow, endCol)
  allCells.clear()
  
  for (let i in userInfo) {
    const id = userInfo[i]['id_str']
    i = parseInt(i)
    const idCell = sheetData.getRange(i + startRow, 1, 1, 1)
    idCell.setValue(id)
    const nameCell = sheetData.getRange(i + startRow, 2, 1, 1)
    nameCell.setValue(userInfo[i]['screen_name']);
    const followCell = sheetData.getRange(i + startRow, 3, 1, 1)
    followCell.setValue(followUserIds.indexOf(id) !== -1);
    const followedCell = sheetData.getRange(i + startRow, 4, 1, 1)
    followedCell.setValue(followedUserIds.indexOf(id) !== -1);
  }
}