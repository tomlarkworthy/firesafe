//found on web API at https://firesafe-sandbox.firebaseio.com/
//we can add additional and revoke individual keys centrally
var FIREBASE_KEY = "9MPlKqcjUPZtbvbUuqD8omoK7f4kRU7FDxBIz2fX"

// my token generator in node.js, using express.js
// I run this on localhost, of course
// in a CI env or on test build server, it would need security itself (e.g. listen only for certain hosts)
var PORT = '8010';

const express  = require('express');
const app      = express();
app.listen(PORT);

var FirebaseTokenGenerator = require('firebase-token-generator');
FBToken = new FirebaseTokenGenerator(FIREBASE_KEY);


app.get('/token/ADMIN/:account', function(req, res) {
    res.send({ token: FBToken.createToken({ account: req.param('account') }, {admin: true}) });
});

app.get('/token/:account', function(req, res) {
    res.send({ token: FBToken.createToken({ account: req.param('account') }) });
});


