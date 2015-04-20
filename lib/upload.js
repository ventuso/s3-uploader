/**
 * Created by kiettv on 4/17/15.
 */
var Promise = require('bluebird');
var S3 = require('aws-sdk').S3;
var fs = require('fs');
var gm = require('gm').subClass({
    imageMagick: true
});
var hash = require('crypto').createHash;

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
        this.opts.resizeQuality = 70;
    }
    if(this.opts.returnExif == null){
        this.opts.returnExif = false;
    }
    if(this.opts.tmpDir == null){
        this.opts.tmpDir = require('os').tmpdir() + '/';
    }
    if(this.opts.tmpPrefix == null){
        this.opts.tmpPrefix = 'gm-'
    }
    if(this.opts.workers == null){
        this.opts.workers = 1;
    }
    this.opts.url = "https://s3-" + this.opts.aws.region + ".amazonaws.com/" + this.opts.aws.params.Bucket + "/";

    this.s3 = new Promise.promisifyAll(new S3(this.opts.aws));
    return this;
}

Upload.prototype._getRandomPath = function () {
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

Upload.prototype.uploadPathIsAvailable = function (path) {
    return this.s3.listObjectsAsync({Prefix: path})
        .then(function(data){
            return data.Contents.length === 0;
        });
};

Upload.prototype.uploadGeneratePath = function (prefix) {
    var path = prefix + this._getRandomPath();
    return this.uploadPathIsAvailable(prefix + this._getRandomPath())
        .then(function(isAvailable){
            if(!isAvailable){
                throw new Error('Path \'' + path + '\' not available!')
            }
            return path;
        });
};

Upload.prototype.upload = function (src, opts) {
    var self = this;
    var prefix = (opts != null ? opts.path : void 0) || this.opts.aws.path;
    return this.uploadGeneratePath(prefix)
        .then(function(dest){
            return new Image(src, dest, opts, self.opts).exec();
        });
};

module.exports = Upload;