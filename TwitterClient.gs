/**
* Twitterの認証に関わる処理をまとめたクラス
* 認証、API実行など
*/
class TwitterClient {
  /**
  * コンストラクタ
  */
  constructor(consumerKey, consumerSecret, clientName) {
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
    this.scriptId = ScriptApp.getScriptId();
    this.clientId = this.scriptId + clientName;
    this.oauth = this._getOAuthService();
  }
  
  /**
  * 認証開始
  */
  authorize () {
    if (this.oauth.hasAccess()) {
      Logger.log('既に認証されています');
    } else {      
      let authorizationUrl = this.oauth.authorize();
      Logger.log('以下のURLからログインを行ってください');
      Logger.log(authorizationUrl);
    }
  }
  
  /**
  * authorize() の後にTwitterでログインした際に実行される処理
  * @return {TextOutput}
  */
  authCallback (request) {
    const isAuthorized = this.oauth.handleCallback(request);
    const mimeType     = ContentService.MimeType.JSON;
    const result = {
      message: isAuthorized ? '認証に成功しました。このタブは閉じてください。' : '認証に失敗しました。',
    }
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(mimeType);
  }
  
  /**
  * Twitterで作ったアプリに登録するための callbackUrl を取得する処理
  * @return {string} 
  */
  getCallbackUrl () {
    return OAuth1.getCallbackUrl(this.scriptId);
  }
  
  /**
  * 認証を解除する
  */
  reset () {
    this.oauth.reset();
    Logger.log('認証を解除しました');
  }
  
  /** 
  * POSTのAPIを実行する
  */
  postRequest (apiUrl, paramsObject) {
    if (this.oauth.hasAccess()) {
      const response = this.oauth.fetch(apiUrl, {
        method: 'post',
        payload: paramsObject
      });
      Logger.log('実行しました: POST ' + apiUrl);
      const result = JSON.parse(response)
      return result
    } else {
      Logger.log('認証されていません');
      throw Error('認証されていません');
    }
  }
  
  /** 
  * GETのAPIを実行する
  */
  getRequest (apiUrl, paramsObject) {
    let paramsStr = '';
    for (var key in paramsObject) {
      // URLに日本語や記号を付けると上手く検索できないことがあるので#も変換する encodeURIComponent をする
      paramsStr += key + '=' + encodeURIComponent(paramsObject[key]) + '&'
    }
    if (paramsStr !== '') {
      // &が余計に付いているので削除しておく
      paramsStr = paramsStr.slice(0, -1);
    }

    if (this.oauth.hasAccess()) {
      let fetchUrl = ''
      if (paramsStr == '') {
        fetchUrl = apiUrl 
      } else {
        fetchUrl = apiUrl + '?' + paramsStr
      }
      const response = this.oauth.fetch(fetchUrl);
      Logger.log('実行しました: GET ' + fetchUrl);
      const result = JSON.parse(response)
      return result
    } else {
      Logger.log('認証されていません');
      throw Error('認証されていません');
    }
  }
  
  /** 
  * ツイートを投稿する
  */
  postTweet (message) {
    const params = { 
      status: message
    }
    const result = this.postRequest ('https://api.twitter.com/1.1/statuses/update.json', params)
    return result
  }
  
  /** 
  * ツイートを検索する
  */
  findRecentTweet (searchWord, since_id = null) {
    const params = {
      q: searchWord, // 検索ワード
      lang: 'ja', // 日本語検索
      locale: 'ja', // 日本限定で検索
      result_type: 'recent', // 直近のツイートを検索
   //   since_id: lastTweetId // これ以前のツイートは見ない
    }
    const result = this.getRequest ('https://api.twitter.com/1.1/search/tweets.json', params)
    return result
  }
  
  
  /**
  * 画像を添付してツイート
  */
  postTweetWithMedia() {
    const postData = pickUpTweetDataInOrder()
    return this.postTweetWithDriveData(postData)
  }

  /**
  * 画像を添付してツイート
  */
  postTweetWithDriveData(postData) {
    // ファイルアップロード処理
    let mediaIds = ''

    if (typeof postData.fileIdArray !== 'undefined') {
      for (let i = 0, il = postData.fileIdArray.length; i < il; i++) {
        const mediaId = this.uploadTwitterForDriveMedia(postData.fileIdArray[i]);
        if (mediaIds !== '') {
          mediaIds += ',' + mediaId
        } else {
          mediaIds = mediaId
        }
      }
    }

    
    // アップロードしたファイルを添付して投稿
    const postUrl = 'https://api.twitter.com/1.1/statuses/update.json'
    const postParam = {
      status: postData.message,
      media_ids: mediaIds
    }
    
    return this.postRequest(postUrl, postParam);
  }
  
  /**
  * Googleドライブから画像を取得してアップロード
  * @return {String} 
  */
  uploadTwitterForDriveMedia (fileId) {
    // ファイルアップロード処理
    const fileByApp = DriveApp.getFileById(fileId)
    const base64Data = Utilities.base64Encode(fileByApp.getBlob().getBytes());
    const uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json'
    const uploadParam = {
      media_data: base64Data
    }
    const uploadResult = this.postRequest(uploadUrl, uploadParam)
    return uploadResult.media_id_string
  }
  
  
  /**
  * 最新のツイートのIDの配列を取得
  * @return {Array} 
  */
  pickupTweetsLatest (screenName, includeRT = false, count = 10) {
    const tweetIds = []
    let loop = 0
    let maxId = ''
    
    // 20件ずつTimeLineを検索していき必要な数のツイートを集める
    while (loop < 5) {
      const result = this.getTimeLine(screenName, includeRT, maxId)
      maxId = result['maxId']
      for (let i in result['tweetIds']) {
        if (tweetIds.indexOf(result['tweetIds'][i]) == -1) {
          tweetIds.unshift(result['tweetIds'][i])
          if (tweetIds.length == count) {
            break
          }
        }
      }
      if (tweetIds.length == count) {
        break
      }
      loop++
      maxId = result['oldestTweetId']
    }  
    if (tweetIds.length < count) {
      Logger.log('直近100ツイートから必要分のツイートを取得できませんでした')
    }
    return tweetIds
  }
  
  
  // ユーザーのタイムラインを取得
  getTimeLine (screenName, includeRT, maxId) {
    const getTimeLineUrl = 'https://api.twitter.com/1.1/statuses/user_timeline.json';
    // RTも1カウントとされてしまうため、少し多めに取得する
    const getTimeLineParam = {
      screen_name: screenName,
      count: 20,
    }
    if (maxId != '') {
      getTimeLineParam['max_id'] = maxId
    }
    
    // GETリクエストを実行
    const getTimeLineResult = this.getRequest(getTimeLineUrl, getTimeLineParam);
    const tweetIds = []
    let oldestTweetId = ''
    for (let i in getTimeLineResult) {
      const tweet = getTimeLineResult[i]
      oldestTweetId = tweet['id_str']
      // 自分の投稿でRTしているものは除く
      if (!includeRT && tweet['retweeted'] && tweet['retweeted_status'] != null) {
        continue
      }
      // 誰かへのTo付け投稿も除く
      if (tweet['text'].slice(0, 1) == '@') {
        continue
      }
      tweetIds.push(tweet['id_str'])
    }
    
    const result = {
      tweetIds: tweetIds,
      oldestTweetId: oldestTweetId
    }
    return result
  }
  
  /**
  * リツイートを行う（既にリツイートしているツイートでも再度リツイート）
  */
  retweet (tweetIds) {
    for (let i in tweetIds) {
      const tweetShowUrl = 'https://api.twitter.com/1.1/statuses/show.json';
      // 最小限のデータで十分なので
      const tweetShowParam = {
        id: tweetIds[i],
        count: 20,
        trim_user: true,
        include_my_retweet: false,
        include_entities: false,
        include_ext_alt_text: false,
        include_card_uri: false
      }
      // ツイートを情報を取得
      const tweetShowResult = this.getRequest(tweetShowUrl, tweetShowParam);
      
      // 既にリツイートされていれば、一度リツイートを解除する
      if (tweetShowResult['retweeted']) {
        const unRetweetUrl = 'https://api.twitter.com/1.1/statuses/unretweet/'+ tweetIds[i] +'.json';
        const unRetweetUrlParam = {
          trim_user: true
        }
        const unRetweetResult = this.postRequest(unRetweetUrl, unRetweetUrlParam);
      }
      
      // リツイート実行
      const retweetUrl = 'https://api.twitter.com/1.1/statuses/retweet/'+ tweetIds[i] +'.json';
      const retweetParam = {
        trim_user: true
      }
      const retweetResult = this.postRequest(retweetUrl, retweetParam);
    }
  }

  /**
  * フォローする
  */
  createFollow (userIds) {
    const url = 'https://api.twitter.com/1.1/friendships/create.json'
    for (let i in userIds) {
      const param = {
        user_id: userIds[i].toString()
      }
      this.postRequest(url, param)
    }
  }
  
  /**
  * アンフォローする
  */
  destroyFollow (userIds) {
    const url = 'https://api.twitter.com/1.1/friendships/destroy.json'
    for (let i in userIds) {
      const param = {
        user_id: userIds[i]
      }
      this.postRequest(url, param)
    }
  }
  

  
  /**
  * フォロー中のユーザーを取得
  */
  getFollowUserIds () {
    const url = 'https://api.twitter.com/1.1/friends/ids.json'
    const param = {
      count: 1000,
      stringify_ids: true
    }
    const result = this.getRequest(url, param)
    return result['ids']
  }
  
  /**
  * フォロワーのユーザーを取得
  */
  getFollowedUserIds () {
    const url = 'https://api.twitter.com/1.1/followers/ids.json'
    const param = {
      count: 1000,
      stringify_ids: true
    }
    const result = this.getRequest(url, param)
    return result['ids']
  }
  
    
  /**
  * フォローユーザーとフォロワーのユーザーから片思いユーザーを取得
  */
  followOnlyUser (followUserIds, followedUserIds, max = 50) {
    const targetUserIds = []
    let count = 0
    for (let i in followUserIds) {
      if (followedUserIds.indexOf(followUserIds[i]) == -1) {
        targetUserIds.push(followUserIds[i])
        count++
      }
      if (count == max) {
        break
      }
    }
    const userInfo = this.lookupUserInfo(targetUserIds)
    return userInfo
  }
  
  /**
  * フォローユーザーとフォロワーのユーザーからファンユーザーを取得
  */
  followedOnlyUser (followUserIds, followedUserIds, max = 50) {
    const userInfoList = [];
    let count = 0
    for (let i in followedUserIds) {
      if (followUserIds.indexOf(followedUserIds[i]) == -1) {
        const userInfo = this.lookupUserInfo([followedUserIds[i]])
        if (userInfo[0].follow_request_sent) {
          continue;
        }
        userInfoList.push(userInfo[0]);
        count++
      }
      if (count == max) {
        break
      }
    }
    return userInfoList
  }
  
  
  /**
  * ユーザーの情報を取得
  */
  lookupUserInfo (userIds) {
    if (userIds.length === 0) {
      Logger.warning('該当のユーザーが見つかりませんでした');
      return [];
    }
    const url = 'https://api.twitter.com/1.1/users/lookup.json'
    const param = {
      user_id: userIds.join(','),
    }
    const result = this.getRequest(url, param)
    return result
  }

  
  /** 
  * OAuthのインスタンスを作る
  */
  _getOAuthService() {
    return OAuth1.createService(this.clientId)
    .setAccessTokenUrl('https://api.twitter.com/oauth/access_token')
    .setRequestTokenUrl('https://api.twitter.com/oauth/request_token')
    .setAuthorizationUrl('https://api.twitter.com/oauth/authorize')
    .setConsumerKey(this.consumerKey)
    .setConsumerSecret(this.consumerSecret)
    .setCallbackFunction('authCallback')
    .setPropertyStore(PropertiesService.getUserProperties());
  }
}

/**
* TwitterClientクラスを外部スクリプトから呼び出すための関数
* @return {TwitterClient}
*/
function getInstance(consumerKey, consumerSecret, clientName = '') {
  const client = new TwitterClient(consumerKey, consumerSecret, clientName);
  clientList[client.oauth.serviceName_] = client
  return client
}

const clientList = {}
/**
* TwitterClientクラスのインスタンスの一覧を取得
* @return {Array}
*/
function getClientList () {
  return clientList
}