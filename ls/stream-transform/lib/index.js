// Generated by CoffeeScript 1.9.2
var Transformer, stream, util,
  slice = [].slice;

stream = require('stream');

util = require('util');

module.exports = function() {
  var argument, callback, data, error, handler, i, j, k, len, options, result, transform, type, v;
  options = {};
  for (i = j = 0, len = arguments.length; j < len; i = ++j) {
    argument = arguments[i];
    type = typeof argument;
    if (argument === null) {
      type = 'null';
    } else if (type === 'object' && Array.isArray(argument)) {
      type = 'array';
    }
    if (i === 0) {
      if (type === 'function') {
        handler = argument;
      } else if (type !== null) {
        data = argument;
      }
      continue;
    }
    if (type === 'object') {
      for (k in argument) {
        v = argument[k];
        options[k] = v;
      }
    } else if (type === 'function') {
      if (handler && i === arguments.length - 1) {
        callback = argument;
      } else {
        handler = argument;
      }
    } else if (type !== 'null') {
      throw new Error('Invalid arguments');
    }
  }
  transform = new Transformer(options, handler);
  error = false;
  if (data) {
    process.nextTick(function() {
      var l, len1, row;
      for (l = 0, len1 = data.length; l < len1; l++) {
        row = data[l];
        if (error) {
          break;
        }
        transform.write(row);
      }
      return transform.end();
    });
  }
  if (callback || options.consume) {
    result = [];
    transform.on('readable', function() {
      var r, results;
      results = [];
      while ((r = transform.read())) {
        results.push(result.push(r));
      }
      return results;
    });
    transform.on('error', function(err) {
      error = true;
      if (callback) {
        return callback(err);
      }
    });
    transform.on('end', function() {
      if (callback && !error) {
        return callback(null, result);
      }
    });
  }
  return transform;
};

Transformer = function(options1, transform1) {
  var base;
  this.options = options1 != null ? options1 : {};
  this.transform = transform1;
  this.options.objectMode = true;
  if ((base = this.options).parallel == null) {
    base.parallel = 100;
  }
  stream.Transform.call(this, this.options);
  this.running = 0;
  this.started = 0;
  this.finished = 0;
  return this;
};

util.inherits(Transformer, stream.Transform);

module.exports.Transformer = Transformer;

Transformer.prototype._transform = function(chunk, encoding, cb) {
  var err;
  this.started++;
  this.running++;
  if (this.running < this.options.parallel) {
    cb();
    cb = null;
  }
  try {
    if (this.transform.length === 2) {
      this.transform.call(null, chunk, (function(_this) {
        return function() {
          var chunks, err;
          err = arguments[0], chunks = 2 <= arguments.length ? slice.call(arguments, 1) : [];
          return _this._done(err, chunks, cb);
        };
      })(this));
    } else {
      this._done(null, [this.transform.call(null, chunk)], cb);
    }
    return false;
  } catch (_error) {
    err = _error;
    return this._done(err);
  }
};

Transformer.prototype._flush = function(cb) {
  this._ending = function() {
    if (this.running === 0) {
      return cb();
    }
  };
  return this._ending();
};

Transformer.prototype._done = function(err, chunks, cb) {
  var chunk, j, len;
  this.running--;
  if (err) {
    return this.emit('error', err);
  }
  this.finished++;
  for (j = 0, len = chunks.length; j < len; j++) {
    chunk = chunks[j];
    if (typeof chunk === 'number') {
      chunk = "" + chunk;
    }
    if (chunk != null) {
      this.push(chunk);
    }
  }
  if (cb) {
    cb();
  }
  if (this._ending) {
    return this._ending();
  }
};