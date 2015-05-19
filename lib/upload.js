/**
 * Created by kiettv on 4/17/15.
 */
var Promise = require('bluebird');
var S3 = require('aws-sdk').S3;
var _ = require('lodash');
var Image = require('./image');

function Upload(awsBucketName, options) {
    this.opts = options ? options : {};
    if (!awsBucketName) {
        throw new TypeError('Bucket name can not be undefined');
    }

    if (this.opts.aws == null) {
        this.opts.aws = {};
    }
    if (this.opts.aws.region == null) {
        this.opts.aws.region = 'us-east-1';
    }
    if (this.opts.aws.path == null) {
        this.opts.path = '';
    }
    else if (this.opts.aws.path != '' && !_.endsWith(this.opts.aws.path, '/')) {
        this.opts.aws.path = this.opts.aws.path + '/';
    }
    if (this.opts.aws.acl == null) {
        this.opts.aws.acl = 'private';
    }
    if (this.opts.aws.sslEnabled == null) {
        this.opts.aws.sslEnabled = true;
    }
    if (this.opts.aws.maxRetries == null) {
        this.opts.aws.maxRetries = 3;
    }
    if (this.opts.aws.accessKeyId == null) {
        throw new TypeError('Access Key Id can not be undefined');
    }
    if (this.opts.aws.secretAccessKey == null) {
        throw new TypeError('Secret Access Key can not be undefined');
    }
    if (this.opts.aws.params == null) {
        this.opts.aws.params = {};
    }
    this.opts.aws.params.Bucket = awsBucketName;
    if (this.opts.aws.httpOptions == null) {
        this.opts.aws.httpOptions = {};
    }
    if (this.opts.aws.httpOptions.timeout == null) {
        this.opts.aws.httpOptions.timeout = 10000;
    }
    if (this.opts.versions == null) {
        this.opts.versions = [];
    }
    if (this.opts.resizeQuality == null) {
        this.opts.resizeQuality = 100;
    }
    if (this.opts.returnExif == null) {
        this.opts.returnExif = false;
    }
    if (this.opts.tmpDir == null) {
        this.opts.tmpDir = require('os').tmpdir() + '/';
    }
    if (this.opts.tmpPrefix == null) {
        this.opts.tmpPrefix = 'gm-'
    }
    if (!_.isFunction(this.opts.pathGenerator)) {
        this.opts.pathGenerator = this.getRandomPath;
    }
    if (!_.isFunction(this.opts.nameGenerator)) {
        this.opts.nameGenerator = this.getRandomName;
    }
    if (this.opts.override == null) {
        this.opts.override = false;
    }
    if (this.opts.url == null) {
        this.opts.url = "https://s3-" + this.opts.aws.region + ".amazonaws.com/" + this.opts.aws.params.Bucket + "/";
    }

    this.s3 = new Promise.promisifyAll(new S3(this.opts.aws));
    return this;
}

Upload.prototype.getRandomPath = function () {
    var i, input, j, res, x, y;
    input = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    res = [];
    for (i = j = 1; j <= 3; i = ++j) {
        x = input[Math.floor(Math.random() * input.length)];
        y = input[Math.floor(Math.random() * input.length)];
        res.push(x + y);
    }
    return res.join('/');
};

Upload.prototype.getRandomName = function () {
    var input = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var res = '';
    for (var i = 1; i <= 4; i++) {
        res = res + input[Math.floor(Math.random() * input.length)];
    }
    return res;
};

Upload.prototype.uploadPathIsAvailable = function (path) {
    return this.s3.listObjectsAsync({Prefix: path})
        .then(function (data) {
            return data.Contents.length === 0;
        });
};

Upload.prototype.uploadGeneratePath = function (prefix, name) {
    var path = prefix + name;
    var self = this;
    return this.uploadPathIsAvailable(path)
        .then(function (isAvailable) {
            if (!isAvailable) {
                if (!self.opts.override) {
                    throw new Error('Path \'' + path + '\' not available!')
                }
            }
            return path;
        });
};

Upload.prototype.upload = function (src, opts) {
    var self = this;
    var prefix = '';
    if(opts != null &&  opts.path != null){
        prefix =  opts.path;
    }
    else{
        prefix = this.opts.aws.path + this.opts.pathGenerator.call();
    }
    if (prefix != '' && !_.endsWith(prefix, '/')) {
        prefix = prefix + '/';
    }
    var name = (opts != null ? opts.name : void 0) || this.opts.nameGenerator.call();
    return this.uploadGeneratePath(prefix, name)
        .then(function (dest) {
            if(src || src === ''){
                throw new Error('Invalid path');
            }
            return new Image(src, dest, opts, self).exec();
        });
};

module.exports = Upload;