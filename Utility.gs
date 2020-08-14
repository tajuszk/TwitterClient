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
  
  const postData = cells[0]; // postData = [ '投稿内容', '投稿回数'] なので postData[0] => 投稿内容, postData[1] => 投稿回数 
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
  const endCol = 2; // 『重み』の列までなので2列目まで
  
  // 投稿を一括で取得する
  const cells = sheetData.getRange(startRow, startCol, endRow, endCol).getValues();
    
  // 重みの合計を出す
  let weightSum = 0;
  for (let i = 0, il = cells.length; i < il; i++ ) {
    weightSum += cells[i][1];
  }

  let randomValue = weightSum * Math.random();
  let postMessage = "";
  for (let i = 0, il = cells.length; i < il; i++ ) {
    randomValue -= cells[i][1];
    if (randomValue < 0) {
      postMessage = cells[i][0];
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
  const endCol = sheetData.getLastColumn(); // 『投稿回数』の列までなので2列目まで
  
  // 投稿を一括で取得する
  const cells = sheetData.getRange(startRow, startCol, endRow, endCol).getValues();
  
  // ちなみにcellsの中身は
  // [ [ '投稿内容', '投稿回数'] ,  [ '投稿内容', '投稿回数'] ,  [ '投稿内容', '投稿回数'] ,....,] 
  // という形式になっている
  // Logger.log(cells);
  
  const targetData = cells[0]; // targetData = [ '投稿内容', '投稿回数'] なので targetData[0] => 投稿内容, targetData[1] => 投稿回数 
  let row = 1 // 行番号（選ばれたらその行の投稿された回数を+1するために持っておく）
  for (var i = 0, il = cells.length; i < il; i++ ) {
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
      let result = targetData[i].split('https://drive.google.com/file/d/')[1];
      result = result.split('/view')[0];
      fileIdArray.push(result)
    }
  }
  
  const postData = {
    message: targetData[0],
    fileIdArray: fileIdArray
  }
  
  return postData;
}
