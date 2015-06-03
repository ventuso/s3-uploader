/**
 * Created by kiettv on 4/17/15.
 */
var Promise = require('bluebird');
var gm = require('gm').subClass({
    imageMagick: false
});
Promise.promisifyAll(gm.prototype);
var hash = require('crypto').createHash;
var rand = require('crypto').pseudoRandomBytes;
var _ = require('lodash');
var fs = require('fs');

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
                exif: self.config.opts.returnExif ? val.Properties : undefined
            };
            return true;
        });
};

Image.prototype.makeMpc = function (suffix) {
    var self = this;
    var src = [self.config.opts.tmpDir, self.config.opts.tmpPrefix, self.tmpName, suffix, '.mpc'].join('');
    return this.gm.writeAsync(src)
        .then(function () {
            return gm(src);
        });
};

Image.prototype.resize = function (version) {
    var self = this;
    return new Promise(function (resolve, reject) {
        if (version) {
            if (typeof version.original !== 'undefined') {
                if (version.original === false) {
                    reject(new Error('version.original can not be false'));
                }
                else {
                    version.src = self.src;
                    version.format = self.meta.format;
                    version.size = self.meta.fileSize;
                    version.width = self.meta.imageSize.width;
                    version.height = self.meta.imageSize.height;
                    resolve(version);
                }
            }
            else {
                self.makeMpc(version.suffix)
                    .then(function (mpc) {
                        version.format = 'jpeg';
                        version.src = [self.config.opts.tmpDir, self.config.opts.tmpPrefix, self.tmpName, version.suffix, '.' + version.format].join('');

                        var resizeWith = version.maxWidth;
                        var resizeHeight = version.maxHeight;
                        if (!version.force && self.meta && self.meta.imageSize) {
                            if (version.maxWidth > self.meta.imageSize.width) {
                                resizeWith = self.meta.imageSize.width;
                            }
                            if (version.maxHeight > self.meta.imageSize.height) {
                                resizeHeight = self.meta.imageSize.height;
                            }
                        }

                        var img = mpc.resize(resizeWith, resizeHeight, '^')
                            .gravity('Center')
                            .crop(resizeWith, resizeHeight)
                            .quality(version.quality || self.config.opts.resizeQuality);
                        if (self.meta.orientation) {
                            img.autoOrient();
                        }
                        if (self.meta.colorSpace !== 'RGB' && self.meta.colorSpace !== 'sRGB') {
                            img.colorspace('RGB');
                        }
                        img.write(version.src, function (err) {
                            if (err) {
                                reject(err);
                            }
                            version.width = version.maxWidth;
                            delete version.maxWidth;
                            version.height = version.maxHeight;
                            delete version.maxHeight;

                            resolve(version);
                        });
                    })
            }
        }
        else {
            reject(new Error('Invalid version'));
        }
    });
};

Image.prototype.upload = function (version) {
    var self = this;
    return new Promise(function (resolve, reject) {
        var options = {
            Key: self.dest + version.suffix + '.' + version.format,
            ACL: version.awsImageAcl || self.config.opts.aws.acl,
            Body: fs.createReadStream(version.src),
            ContentType: 'image/' + version.format,
            Metadata: self.config.opts.metadata || {}
        };

        return self.config.s3.putObject(options, function (err, data) {
            if (err) {
                return reject(err);
            }
            // delete local file
            try {
                if (!version.keep) {
                    fs.unlink(version.src, function (err) {
                        if (err) {
                            console.log('error when deleted : ' + version.src);
                        }
                        console.log('successfully deleted : ' + version.src);
                    });
                }
                var cache = [self.config.opts.tmpDir, self.config.opts.tmpPrefix, self.tmpName, version.suffix, '.cache'].join('');
                fs.unlink(cache, function (err) {
                    if (err) {
                        console.log('error when deleted : ' + cache);
                    }
                    console.log('successfully deleted : ' + cache);
                });
                var mpc = [self.config.opts.tmpDir, self.config.opts.tmpPrefix, self.tmpName, version.suffix, '.mpc'].join('');
                fs.unlink(mpc, function (err) {
                    if (err) {
                        console.log('error when deleted : ' + mpc);
                    }
                    console.log('successfully deleted : ' + mpc);
                });
            }
            catch (err) {
                console.log(err);
            }

            version.etag = data.ETag.substr(1, data.ETag.length - 2);
            version.path = options.Key;
            if (self.config.opts.url) {
                version.url = self.config.opts.url + version.path;
            }
            delete version.awsImageAcl;
            delete version.suffix;

            resolve(version);
        });
    });
};

Image.prototype.resizeAndUpload = function (version) {
    var self = this;
    version.suffix = version.suffix || '';
    return this.resize(version)
        .then(function (image) {
            return self.upload(image);
        });
};

Image.prototype.exec = function () {
    var self = this;
    return this.getMeta()
        .then(function () {
            var list = [];
            var versions = JSON.parse(JSON.stringify(self.config.opts.versions));
            _.forEach(versions, function (version) {
                list.push(self.resizeAndUpload(version));
            });
            return Promise.all(list)
        })
        .then(function (files) {
            return files;
        })
};

module.exports = Image;
