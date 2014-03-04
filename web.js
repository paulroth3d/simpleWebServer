//-- sample web server from https://gist.github.com/rpflorence/701407

//-- constants
var DEFAULT_PORT = 8888;
var PATH_AUTH = /^\/auth\//i;

var STATUS_INTERNAL_SERVER_ERROR = 500;
var STATUS_NOT_FOUND = 404;
var STATUS_SUCCESS = 200;

var HEADER_TEXT_PLAIN = {"Content-Type": "text/plain"};

//-- basic modules
var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs")
    port = process.argv[2] || DEFAULT_PORT;
    
//-- common functions
function matchesLocation( uri, pattern ){
	try {
		var results = uri.match( pattern );
		if( results.length == 1 ){
			return( true );
		} else if( results.length > 1 ){
			console.warn( "multiple matches multiple times" );
			return( true );
		} else {
			return( false );
		}
	} catch( err ){
		console.error( "unable to match uri[" + uri + "]" );
	}
	
	return( false );
}

//-- create server
http.createServer(function(request, response) {

  var uri = url.parse(request.url).pathname
    , filename = path.join(process.cwd(), uri);
    
  var auth = request.headers["authorization"];
  console.log( "authorization header:", auth );
  
  console.log( "uri:", uri );
  console.log( "filename:", filename );
  
  if( matchesLocation( uri, PATH_AUTH )){
  	  console.log( "in authentication area" );
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
