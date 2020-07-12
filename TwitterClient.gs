/**
* TwitterClientクラスを外部スクリプトから呼び出すための関数
* @return {TwitterClient}
*/
function getInstance(consumerKey, consumerSecret) {
  return new TwitterClient(consumerKey, consumerSecret);
}

/**
* Twitterの認証に関わる処理をまとめたクラス
* 認証、API実行など
*/
class TwitterClient {
  /**
  * コンストラクタ
  */
  constructor(consumerKey, consumerSecret) {
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
    this.scriptId = ScriptApp.getScriptId();
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
    let isAuthorized = this.oauth.handleCallback(request);
    let mimeType     = ContentService.MimeType.JSON;
    let result = {
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
      let response = this.oauth.fetch(apiUrl, {
        method: 'post',
        payload: paramsObject
      });
      Logger.log('実行しました');
      let result = JSON.parse(response)
      return result
    } else {
      Logger.log('認証されていません');
      throw Error();
    }
  }
  
  /** 
  * GETのAPIを実行する
  */
  getRequest (apiUrl, paramsObject) {
    var paramsStr = '';
    for (var key in paramsObject) {
      // URLに日本語や記号を付けると上手く検索できないことがあるので#も変換する encodeURIComponent をする
      paramsStr += key + '=' + encodeURIComponent(paramsObject[key]) + '&'
    }
    // &が余計に付いているので削除しておく
    var paramsStr = paramsStr.slice(0, -1);
    
    if (this.oauth.hasAccess()) {
      let response = this.oauth.fetch(apiUrl + '?' + paramsStr);
      Logger.log('実行しました');
      let result = JSON.parse(response)
      return result
    } else {
      Logger.log('認証されていません');
      throw Error();
    }
  }
  
  /** 
  * ツイートを投稿する
  */
  postTweet (message) {
    let params = { 
      status: message
    }
    let result = this.postRequest ('https://api.twitter.com/1.1/statuses/update.json', params)
    return result
  }
  
  /** 
  * ツイートを検索する
  */
  findRecentTweet (searchWord, since_id = null) {
    let params = {
      q: searchWord, // 検索ワード
      lang: 'ja', // 日本語検索
      locale: 'ja', // 日本限定で検索
      result_type: 'recent', // 直近のツイートを検索
   //   since_id: lastTweetId // これ以前のツイートは見ない
    }
    let result = this.getRequest ('https://api.twitter.com/1.1/search/tweets.json', params)
    return result
  }
  
  /** 
  * OAuthのインスタンスを作る
  */
  _getOAuthService() {
    return OAuth1.createService(this.scriptId)
    .setAccessTokenUrl('https://api.twitter.com/oauth/access_token')
    .setRequestTokenUrl('https://api.twitter.com/oauth/request_token')
    .setAuthorizationUrl('https://api.twitter.com/oauth/authorize')
    .setConsumerKey(this.consumerKey)
    .setConsumerSecret(this.consumerSecret)
    .setCallbackFunction('authCallback')
    .setPropertyStore(PropertiesService.getUserProperties());
  }
}