/**
 * Created by kiettv on 4/17/15.
 */
var Promise = require('bluebird');
var gm = require('gm').subClass({
    imageMagick: true
});
Promise.promisifyAll(gm.prototype);
var hash = require('crypto').createHash;
var rand = require('crypto').pseudoRandomBytes;

function Image(src, dest, opts, config) {
    this.config = config;
    this.src = src;
    this.dest = dest;
    this.tmpName = hash('sha1').update(rand(128)).digest('hex');
    this.opts = opts || {};
    this.meta = {};
    this.gm = gm(this.src);
}

Image.prototype.getMeta = function () {
    var self = this;
    return this.gm.identifyAsync()
        .then(function (val) {
            self.meta = {
                format: val.format.toLowerCase(),
                fileSize: val.Filesize,
                imageSize: val.size,
                orientation: val.Orientation,
                colorSpace: val.Colorspace,
                compression: val.Compression,
                quality: val.Quality,
                exif: self.config.returnExif ? val.Properties : undefined
            };
            return true;
        });
};

Image.prototype.makeMpc = function () {
    var self = this;
    return this.gm.writeAsync(self.src + '.mpc')
        .then(function () {
            return self.gm = gm(self.src + '.mpc');
        });
};

Image.prototype.resize = function(version, cb) {
    var img, ref;
    if (typeof version.original !== 'undefined') {
        if (version.original === false) {
            throw new Error("version.original can not be false");
        }
        version.src = this.src;
        version.format = this.meta.format;
        version.size = this.meta.fileSize;
        version.width = this.meta.imageSize.width;
        version.height = this.meta.imageSize.height;
        return process.nextTick(function() {
            return cb(null, version);
        });
    }
    version.format = 'jpeg';
    version.src = [this.config.opts.tmpDir, this.config.opts.tmpPrefix, this.tmpName, version.suffix, "." + version.format].join('');
    img = this.gm.resize(version.maxWidth, version.maxHeight).quality(version.quality || this.config.opts.resizeQuality);
    if (this.meta.orientation) {
        img.autoOrient();
    }
    if ((ref = this.meta.colorSpace) !== 'RGB' && ref !== 'sRGB') {
        img.colorspace('RGB');
    }
    return img.write(version.src, function(err) {
        if (err) {
            return cb(err);
        }
        version.width = version.maxWidth;
        delete version.maxWidth;
        version.height = version.maxHeight;
        delete version.maxHeight;
        return cb(null, version);
    });
};

Image.prototype.upload = function(version, cb) {
    var options;
    options = {
        Key: this.dest + version.suffix + '.' + version.format,
        ACL: version.awsImageAcl || this.config.opts.aws.acl,
        Body: fs.createReadStream(version.src),
        ContentType: 'image/' + version.format,
        Metadata: this.opts.metadata || {}
    };
    return this.config.s3.putObject(options, (function(_this) {
        return function(err, data) {
            if (err) {
                return cb(err);
            }
            version.etag = data.ETag.substr(1, data.ETag.length - 2);
            version.path = options.Key;
            if (_this.config.opts.url) {
                version.url = _this.config.opts.url + version.path;
            }
            delete version.awsImageAcl;
            delete version.suffix;
            return cb(null, version);
        };
    })(this));
};

Image.prototype.resizeAndUpload = function(version, cb) {
    version.suffix = version.suffix || '';
    return this.resize(version, (function(_this) {
        return function(err, version) {
            if (err) {
                return cb(err);
            }
            return _this.upload(version, cb);
        };
    })(this));
};


Image.prototype.exec = function () {
    var self = this;
    return this.getMeta()
        .then(function () {
            return self.makeMpc();
        })
        .then(function () {
            var versions = self.config.versions;
        });
};

module.exports = Image;
