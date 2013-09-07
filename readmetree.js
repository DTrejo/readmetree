var fs = require('fs')
var path = require('path')
var http = require('http')

var _ = require('underscore')
var marked = require('marked')

var style = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8')
var nav = fs.readFileSync(path.join(__dirname, 'nav.html'), 'utf8')
var PORT = 9999
var root = process.argv[2]

if (!root) root = process.cwd()
root = root.replace('~', process.env.HOME)
root = path.resolve(process.cwd(), root)

var content = {}
http.createServer(function(req, res) {
    if (!content.hasOwnProperty(req.url)) return res.end('404z dude.')
    res.setHeader('content-type', 'text/html')
    return res.end(content[req.url])
}).listen(PORT);

readdirRecur(root, isNodeModules)
    .filter(isReadme)
    .sort()
    .forEach(function(readme) {
        var shortpath = readme.replace(path.dirname(path.dirname(readme)), '')
        content[shortpath] =
            style + nav + marked(fs.readFileSync(readme, 'utf8'))
        content['/'] +=
            '<br><a href="http://localhost:'+PORT+shortpath+'">"'
            + 'http://localhost:'+PORT+shortpath+'</a>';
    })
console.log('http://localhost:'+PORT+' is serving all your readmes')

function isNodeModules(f) {
    var bname = path.basename(f)
    return 'node_modules' === bname
}
function isReadme(file) {
    return path.basename(file).toLowerCase().indexOf('readme') === 0
}

function readdirRecur(dir, recurAgain) {
    var files = fs.readdirSync(dir)
    files = files.map(function(f) {
        return path.join(dir, f)
    })
    var moreFiles = []
    files.forEach(function(f) {
        if (!recurAgain(f)) return
        // console.log('recur on', f)
        var module_dirs = fs.readdirSync(f)
        module_dirs.forEach(function(module_dir) {
            moreFiles = moreFiles.concat(
                readdirRecur(path.join(f, module_dir), recurAgain)
            )
        })
    })
    return files.concat(moreFiles)
}
