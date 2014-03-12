#!/usr/bin/env node

var http = require('http')
var exec = require('child_process').exec

var ReadmeTree = require('../')
var PORT = 9999

var readmetree = new ReadmeTree(process.argv[2])

readmetree.setup(startServer)

function startServer() {
  http.createServer(serveRequest).listen(PORT)
  var url = 'http://localhost:'+PORT
  console.log(url+' is serving all your readmes')
  exec('open '+url)
}

function serveRequest(req, res) {
  return readmetree.serveRequest(req, res)
}
