//-- sample web server from https://gist.github.com/rpflorence/701407

//-- constants
var DEFAULT_PORT = 8888;
var PATH_AUTH = /^\/auth\//i;
var PATH_REAUTH = /[&?]reauth=true/i;

var STATUS_INTERNAL_SERVER_ERROR = 500;
var STATUS_AUTHENTICATE = 401;
var STATUS_NOT_FOUND = 404;
var STATUS_SUCCESS = 200;

var HEAD_AUTHENTICATE_KEY = 'WWW-Authenticate';
var HEAD_AUTHENTICATE = 'Basic realm="Secure Area"';

var HEADER_TEXT_PLAIN = {"Content-Type": "text/plain"};

//-- basic modules
var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs")
    port = process.argv[2] || DEFAULT_PORT;
    
//-- common functions
function matchesLocation( uri, pattern ){
	console.log( "matching[", uri, "] pattern[", pattern, "]" );
	try {
		var results = uri.match( pattern );
		if( results == null ){
			return( false );
		} else if( results.length == 1 ){
			return( true );
		} else if( results.length > 1 ){
			console.warn( "multiple matches multiple times" );
			return( true );
		} else {
			return( false );
		}
	} catch( err ){
		console.error( "unable to match uri[" + uri + "]:" + err );
	}
	
	return( false );
}

function parseAuthentication( auth ){
	if( !auth ){
		throw( new Exception( "Auth was null" ));
	}
	
	var authSplit = auth.split( /\s+/ );
	var authBuf = new Buffer( authSplit[1], 'base64' );
	var authPlain = authBuf.toString();
	
	console.log( "authPlain:" + authPlain );
	
	var creds = authPlain.split( /\s*:\s*/ );
	
	var results = {};
	results.user = creds[0];
	results.pass = creds[1];
	
	console.log( "creds:", results );
	return( results );
}

function strToBoolean( str ){
	if( !str ){
		return( false );
	} else {
		return( str.toLowerCase() == "true" );
	}
}

function forceAuthentication( response ){
	console.log( "reauthenticating" );
	response.statusCode = STATUS_AUTHENTICATE;
	response.setHeader( HEAD_AUTHENTICATE_KEY, HEAD_AUTHENTICATE );
	
	response.end( "<HTML><BODY>Need Credentials</BODY></HTML>" );
}

//-- create server
http.createServer(function(request, response) {

  var uri = url.parse(request.url).pathname
    , filename = path.join(process.cwd(), uri)
    , params = url.parse( request.url, true ).query;
    
  var auth = request.headers["authorization"];
  
  console.log( "request.uri:", request.url );
  console.log( "uri:", uri );
  console.log( "filename:", filename );
  //console.log( "reauth:", reauth );
  
  //var shouldReauthenticate = matchesLocation( request.url, PATH_REAUTH );//reauth == true || reauth == "true";
  var shouldReauthenticate = strToBoolean( params.reauth );
  
  if( matchesLocation( uri, PATH_AUTH )){
  	  console.log( "in authentication area" );
  	  
  	  if( !auth || shouldReauthenticate ){
  	  	  forceAuthentication( response );
  	  	  return;
  	  } else {
  	  	  console.log( "authentication found" );
  	  	  try {
  	  	  	 var creds = parseAuthentication( auth );
  	  	  	 //-- we don't really care what the creds are for now.
  	  	  	 //if( creds.user == blah && creds.pass == blah ){
  	  	  	 //} else { forceAuthentication( response ); return; }
  	  	  } catch( err ){
  	  	  	 console.log( "auth:" + auth );
  	  	  	 console.error( "unable to parse authentiction:" + err );
  	  	  }
  	  }
  }
  
  var showFile = function( filename ){
  	fs.readFile(filename, "binary", function(err, file) {
      if(err) {        
        response.writeHead(STATUS_INTERNAL_SERVER_ERROR, HEADER_TEXT_PLAIN);
        response.write(err + "\n");
        response.end();
        return;
      }

      response.writeHead(STATUS_SUCCESS);
      response.write(file, "binary");
      response.end();
    });
  };
  
  path.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(STATUS_SUCCESS, HEADER_TEXT_PLAIN);
      response.write("404 Not Found\n");
      response.end();
      return;
    }

    if (fs.statSync(filename).isDirectory()){
      filename += '/index.html';
      
      path.exists(filename, function(exists) {
	    if(!exists) {
	      response.writeHead(STATUS_SUCCESS, HEADER_TEXT_PLAIN);
	      response.write("404 Not Found\n");
	      response.end();
	      return;
	    } else {
	    	showFile( filename );
	    }
	  });
      
    } else {
    	showFile( filename );
    }
  });
}).listen(parseInt(port, 10));

console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
