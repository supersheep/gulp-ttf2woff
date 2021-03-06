var Stream = require('readable-stream')
  , gutil = require('gulp-util')
  , BufferStreams = require('bufferstreams')
  , ttf2woff = require('ttf2woff')
  , path = require('path')
;

const PLUGIN_NAME = 'gulp-ttf2woff';

// File level transform function
function ttf2woffTransform(opt) {
  // Return a callback function handling the buffered content
  return function(err, buf, cb) {

    // Handle any error
    if(err) {
      cb(new gutil.PluginError(PLUGIN_NAME, err, {showStack: true}));
    }

    // Use the buffered content
      try {
        buf = new Buffer(ttf2woff(new Uint8Array(buf)).buffer);
        cb(null, buf);
      } catch(err) {
        cb(new gutil.PluginError(PLUGIN_NAME, err, {showStack: true}));
      }

  };
}

// Plugin function
function ttf2woffGulp(options) {

  options = options || {};
  options.ignoreExt = options.ignoreExt || false;
  options.clone = options.clone || false;

  var stream = new Stream.Transform({objectMode: true});

  stream._transform = function(file, unused, done) {
     // When null just pass through
    if(file.isNull()) {
      stream.push(file); done();
      return;
    }

    // If the ext doesn't match, pass it through
    if((!options.ignoreExt) && '.ttf' !== path.extname(file.path)) {
      stream.push(file); done();
      return;
    }

    if(options.clone) {
      stream.push(file.clone());
    }

    file.path = gutil.replaceExtension(file.path, ".woff");

    // Buffers
    if(file.isBuffer()) {
      try {
        file.contents = new Buffer(ttf2woff(
          new Uint8Array(file.contents)
        ).buffer);
      } catch(err) {
        stream.emit('error', new gutil.PluginError(PLUGIN_NAME, err, {
          showStack: true
        }));
      }

    // Streams
    } else {
      file.contents = file.contents.pipe(new BufferStreams(ttf2woffTransform()));
    }

    stream.push(file);
    done();

  };

  return stream;

};

// Export the file level transform function for other plugins usage
ttf2woffGulp.fileTransform = ttf2woffTransform;

// Export the plugin main function
module.exports = ttf2woffGulp;

