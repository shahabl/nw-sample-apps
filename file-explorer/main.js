global.$ = $;

var abar = require('address_bar');
var folder_view = require('folder_view');
var gui = require('nw.gui');

// Extend application menu for Mac OS
if (process.platform == "darwin") {
  var menu = new gui.Menu({type: "menubar"});
  menu.createMacBuiltin && menu.createMacBuiltin(window.document.title);
  gui.Window.get().menu = menu;
}

var App = {
  // show "about" window
  about: function () {
    var params = {toolbar: false, resizable: false, show: true, height: 120, width: 350};
    var aboutWindow = gui.Window.open('about.html', params);
    aboutWindow.on('document-end', function() {
      aboutWindow.focus();
      // open link in default browser
      $(aboutWindow.window.document).find('a').bind('click', function (e) {
        e.preventDefault();
        gui.Shell.openExternal(this.href);
      });
    });
  },

  // change folder for sidebar links
  cd: function (anchor) {
    anchor = $(anchor);

    $('#sidebar li').removeClass('active');
    $('#sidebar i').removeClass('icon-white');

    anchor.closest('li').addClass('active');
    anchor.find('i').addClass('icon-white');

    this.setPath(anchor.attr('nw-path'));
  },

  // set path for file explorer
  setPath: function (path) {
    if (path.indexOf('~') == 0) {
      path = path.replace('~', process.env['HOME']);
    }
    this.folder.open(path);
    this.addressbar.set(path);
  }
};

$(document).ready(function() {
  var folder = new folder_view.Folder($('#files'));
  var addressbar = new abar.AddressBar($('#addressbar'));
  var fs = require('fs');
  //require('nw.gui').Window.get().showDevTools();

  folder.open(process.cwd());
  addressbar.set(process.cwd());

  App.folder = folder;
  App.addressbar = addressbar;

  function upload(file) {
    var options = {
      url: 'http://httpbin.org/put',
      bodyType: 'binary',
    };

    var input = fs.readFileSync(file);
    var oldProgress = 0;
    var xhr = new XMLHttpRequest();
    xhr.open('PUT', options.url, true);
    
    xhr.addEventListener('load', function () {
      if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
        alert('upload done');
      } else {
        alert('Error: '+xhr.status);
      }
    }, false);
    
    xhr.addEventListener('error', function (e) {
      alert('error: '+e.message);
    }, false);
    
    xhr.upload.addEventListener('progress', function (p) {
      var progress=0;
      if(p.position && p.total) progress = p.position/p.total;
      if(progress-oldProgress>0.2) {
        alert('progress: '+progress);
        oldProgress=progress;
      }
    }, false);
    
    xhr.send(input);
    
  }
  
  folder.on('navigate', function(dir, mime) {
    if (mime.type == 'folder') {
      addressbar.enter(mime);
    } else {
      upload(mime.path);
    }
  });

  addressbar.on('navigate', function(dir) {
    folder.open(dir);
  });

  // sidebar favorites
  $('[nw-path]').bind('click', function (event) {
    event.preventDefault();
    App.cd(this);
  });

  gui.Window.get().show();
});
