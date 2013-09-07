var fs = require('fs')
var path = require('path')
var http = require('http')
var exec = require('child_process').exec

var _ = require('underscore')
var marked = require('marked')

var style = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8')
var nav = fs.readFileSync(path.join(__dirname, 'nav.html'), 'utf8')
var PORT = 9999
var root = process.argv[2]

if (!root) root = process.cwd()
root = root.replace('~', process.env.HOME)
root = path.resolve(process.cwd(), root)

var content = { '/' : style
    + '<br><h1><a href="http://github.com/dtrejo/readmetree">readmetree</a><h3>'
}
http.createServer(function(req, res) {
    if (!content.hasOwnProperty(req.url)) {
        return res.end('<h1>404z dude.</h1>'+content['/'])
    }
    res.setHeader('content-type', 'text/html')
    return res.end(content[req.url])
}).listen(PORT)

readdirRecur(root, isNodeModules)
    .filter(isReadme)
    .sort()
    .forEach(function(readme) {
        // console.log(readme)
        var shortpath = readme.replace(path.dirname(path.dirname(readme)), '')
        if (content[shortpath]) return
        content[shortpath] =
            style + nav + marked(fs.readFileSync(readme, 'utf8'))
        content['/'] +=
            '<br><a href="http://localhost:'+PORT+shortpath+'">'
            + 'http://localhost:'+PORT+'<b>'+shortpath+'</b></a>'
    })

var url = 'http://localhost:'+PORT
console.log(url+' is serving all your readmes')
exec('open '+url)

function isNodeModules(f) {
    var bname = path.basename(f)
    return 'node_modules' === bname
}
function isReadme(file) {
    return path.basename(file).toLowerCase().indexOf('readme.m') === 0
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
