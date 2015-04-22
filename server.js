/**
 * Created by kiettv on 4/20/15.
 */
'use strict';
var Uploader = require('./lib');
var opts = {
    aws: {
        region: 'ap-southeast-1', //us-east-1 | us-west-2 | us-west-1 | eu-west-1 | eu-central-1 | ap-southeast-1 | ap-southeast-2 | ap-northeast-1 | sa-east-1
        path: 'test/',
        acl: 'public-read', // 'private | public-read | public-read-write | authenticated-read | bucket-owner-read | bucket-owner-full-control'
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
    returnExif: false, // keep exif
    resizeQuality: 80, // default resize quality, if quality for specific version is not set
    tmpPrefix: 'gm-', // temporary file's prefix
    pathGenerator: function(){
        return 'test-test'
    },
    versions: [
        {
            original: true,
            keep: true // not delete after upload
        },
        {
            suffix: '-rectangle-vertical',
            quality: 80,
            maxHeight: 768,
            maxWidth: 1024,
            force: false // Force scale up if the configuration size greater than image actual size
        }
    ]
};

var uploader = new Uploader('kiettv-s3', opts);
uploader.upload('/home/kiettv/Downloads/test.jpeg')
    .then(function(ret){
        console.info(ret);
    })
    .catch(function(err){
       console.error(err);
    });