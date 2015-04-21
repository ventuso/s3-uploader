/**
 * Created by kiettv on 4/20/15.
 */
'use strict';
var Promise = require('bluebird');
var AWS = require('aws-sdk');

var Uploader = require('./lib/upload');

var opts = {
    aws: {
        region: 'ap-southeast-1',
        path: 'test/',
        acl: 'public-read',
        sslEnabled: true,
        maxRetries: 3,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        params: {
            Bucket: 'kiettv-s3',
            httpOptions: {
                timeout: 10000
            }
        }
    },
    versions: [
        {
            original: true
        },
        {
            suffix: '-aaa',
            quality: 80,
            maxHeight: 300,
            maxWidth: 400
        },
        {
            suffix: '-rectangle-vertical',
            quality: 80,
            maxHeight: 768,
            maxWidth: 1024
        },
        {
            suffix: '-rectangle-horizontal',
            quality: 80,
            maxHeight: 1024,
            maxWidth: 768
        },
        {
            suffix: '-square',
            maxHeight: 320,
            maxWidth: 320
        }
    ]
};

var uploader = new Uploader('kiettv-s3', opts);

uploader.upload('/home/kiettv/Downloads/test.jpg')
    .then(function(ret){
        console.info(ret);
    })
    .catch(function(err){
       console.error(err);
    });

//
//var s3 = new Promise.promisifyAll(new AWS.S3(opts.aws));
//s3.listObjectsAsync({Prefix: 'merchants'})
//    .then(function (ret) {
//        console.info(ret);
//    })
//    .catch(function (err) {
//        console.error(err);
//    });

//var Promise = require('bluebird');
//var gm = require('gm');
//Promise.promisifyAll(gm.prototype);
//gm('/home/kiettv/Downloads/test.jpg').identifyAsync()
//.then(function (ret) {
//    console.info(ret);
//})
//.catch(function (err) {
//    console.error(err);
//});