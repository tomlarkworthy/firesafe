// here is the WsTest lib referred to in test-unit.js

var WsTest;
(function ($) {
   "use strict";
   
   var FIREBASE_URL = 'https://firesafe-sandbox.firebaseio.com/';
   /**FIREBASE_ADMIN_TOKEN generated using auth-server "http://localhost:8010/token/ADMIN/tom/blah"**/
   var FIREBASE_ADMIN_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhZG1pbiI6dHJ1ZSwidiI6MCwiZCI6eyJhY2NvdW50IjoidG9tIn0sImlhdCI6MTM4ODI0MTkxMH0.sIeIzraVNKLgBGeLi0_ZKQMohTRG8CXVR8LcImPd4wU';
   var API_URL = 'http://localhost:8010';

   WsTest = {
      FB: new Firebase(FIREBASE_URL),
      fbReady: $.Deferred(),
      
      // authenticate to firebase as super user
      sup: function() {
         // clear any opened auth
         WsTest.FB.unauth();
         
         // set the promise we'll watch to see when auth is done
         WsTest.fbReady = WsTest.def();
         
         // invoke the authentication
         WsTest.FB.auth(FIREBASE_ADMIN_TOKEN, function(error) {
            if( error ) {
               WsTest.fbReady.reject(_.sprintf('unable to authenticate to Firebase "%s": %s', API_URL, error));
            }
            else {
               WsTest.fbReady.resolve(WsTest.FB);
            }
         });
         return WsTest.fbReady;
      },
      
      // authenticate to Firebase as any user in the system
      auth: function(usr) {
         WsTest.FB.unauth();
         WsTest.fbReady = WsTest.def();
         $.ws.fn.getJSON(API_URL + _.sprintf('token/%s', usr, $.ws.conf.skey))
            .success(function(json) {
               WsTest.FB.auth(json.data.token, function(error) {
                  console.log('authed', usr, error); //debug
                  if( error ) {
                     WsTest.fbReady.reject(_.sprintf('unable to authenticate to Firebase "%s": %s', $.ws.conf.api_url, error));
                  }
                  else {
                     WsTest.fbReady.resolve(WsTest.FB);
                  }
               });
            })
            .fail(function(error) {
               WsTest.fbReady.reject(_.sprintf('unable to authenticate to Firebase (is %s running?): %s', $.ws.conf.api_url, error))
            });
         return WsTest.fbReady;
      },
      
      // create a deferred that times out after a certain amount of time
      def: function(milliseconds, fn, scope) {
          var args = _.toArray(arguments);
          milliseconds = _.isNumber(args[0])? args.shift() : 5000;
          fn = args.shift();
          if( args.length ) {
             fn = fn.bind.apply(fn, args);
          }
          var def = $.Deferred(fn);
          var to = _.delay(def.reject.bind(def, 'expired'), milliseconds || 5000);
          def.always(function() { clearTimeout(to); });
          return def;
       }
   };
})(jQuery);
