var fs = require('fs')
var path = require('path')
var http = require('http')
var exec = require('child_process').exec

var _ = require('underscore')
var marked = require('marked')
var highlight = require('highlight.js')
var special = require('special-html')
var glob = require('glob')

var style = fs.readFileSync(path.join(__dirname, 'assets', 'style.css'), 'utf8')
var nav = fs.readFileSync(path.join(__dirname, 'assets', 'nav.html'), 'utf8')
var PORT = 9999
var root = process.argv[2]

if (!root) root = process.cwd()
root = path.resolve(process.cwd(), root)

var content = {
  '/': style
    + '<br><h1><a href="http://github.com/dtrejo/readmetree">readmetree</a><h3>'
}

marked.setOptions({
  highlight: function (code) {
    return highlight.highlightAuto(code).value
  }
})

http.createServer(function(req, res) {
  if (!content.hasOwnProperty(req.url)) {
    return res.end('<h1>404z dude.</h1>' + content['/'])
  }
  res.setHeader('content-type', 'text/html')
  return res.end(content[req.url])
}).listen(PORT)

glob('**/readme.m*', { cwd: root, nocase: true }, renderFiles)

function renderFiles(err, files) {
  if (err) {
    console.error(err)
    return process.exit(1)
  }

  var fileCount = files.length

  files = files.sort(function(a, b) {
    var aa = path.basename(path.dirname(a)).toLowerCase()
    var bb = path.basename(path.dirname(b)).toLowerCase()
    return aa.localeCompare(bb)
  })
  .forEach(function(readme) {
    var shortpath = path.sep + readme.split(path.sep).slice(-2).join(path.sep)
    var moduleName = shortpath.split(path.sep)[1]
    if (shortpath.lastIndexOf(path.sep) === 0) {
      moduleName = path.basename(root)
    }

    if (content[shortpath]) return --fileCount

    content['/'] +=
      '<br><a href="http://localhost:'+PORT+shortpath+'">'
      + moduleName + '</a>'
    content[shortpath] = style + nav 

    loadReadme(path.resolve(root, readme), shortpath, moduleName)
  })

  function loadReadme(readme, shortpath, name) {
    fs.readFile(readme, 'utf8', render)

    function render(err, contents) {
      marked(contents, addReadme)
    }

    function addReadme(err, html) {
      content[shortpath] += html

      if (--fileCount === 0) {
        var url = 'http://localhost:'+PORT
        console.log(url+' is serving all your readmes')
        exec('open '+url)
      }
    }
  }
}
