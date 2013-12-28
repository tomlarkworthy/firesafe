// here's an example of authenticating and testing access to a path

module('A Typical Set of Tests');

asyncTest('A Typical Test', function() {
    expect(1);

    // log in as super user
    WsTest.sup().then(
        // create a promise that expires if something goes wrong
        $.ws.fn.expires.bind(null, function(def) {
         
         // try to remove a firebase reference (security should allow this)
         WsTest.FB.child('something to test security on').remove(function(error) {
            if( error ) { def.reject('error'); } // test failed
            else { def.resolve(); }
         });

    }))

    // test our results
    .success(function() { ok(true, 'I was able to remove the path') })
    .fail(function(error) { ok(false, error) })

    // tell qunit the test is done!
    .always(start);
});