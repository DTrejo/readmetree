var fs = require('fs')
var path = require('path')

var marked = require('marked')
var highlight = require('highlight.js')
var special = require('special-html')
var glob = require('glob')

var style = fs.readFileSync(path.join(__dirname, 'assets', 'style.css'), 'utf8')
var nav = fs.readFileSync(path.join(__dirname, 'assets', 'nav.html'), 'utf8')

module.exports = ReadmeTree

function ReadmeTree(root) {
  this.root = root || process.cwd()
  this.root = path.resolve(process.cwd(), this.root)
  this.content = {
    '/': style
      + '<br><h1><a href="https://github.com/dtrejo/readmetree">readmetree</a><h1>'
  }

  marked.setOptions({
    highlight: function (code) {
      return highlight.highlightAuto(code).value
    }
  })

  return this
}

ReadmeTree.prototype.setup = function ReadmeTree$setup(callback) {
  var self = this

  glob('**/readme.m*', { cwd: self.root, nocase: true }, renderFiles)

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
        moduleName = path.basename(self.root)
      }

      if (self.content[shortpath]) return --fileCount

      self.content['/'] +=
        '<br><a href="'+shortpath+'">'
        + moduleName + '</a>'
      self.content[shortpath] = style + nav 

      loadReadme(path.resolve(self.root, readme), shortpath, moduleName)
    })

    function loadReadme(readme, shortpath, name) {
      fs.readFile(readme, 'utf8', render)

      function render(err, contents) {
        if (err) {
          return callback(err)
        }
        marked(contents, addReadme)
      }

      function addReadme(err, html) {
        if (err) {
          return callback(err)
        }
        self.content[shortpath] += special(html)

        if (--fileCount === 0) {
          callback(null, Object.keys(self.content).length)
        }
      }
    }
  }
}

ReadmeTree.prototype.serveRequest = ReadmeTree$serveRequest

function ReadmeTree$serveRequest(req, res) {
  if (!this.content.hasOwnProperty(req.url)) {
    return res.end('<h1>404z dude.</h1>' + this.content['/'])
  }
  res.setHeader('content-type', 'text/html')
  return res.end(this.content[req.url])
}
