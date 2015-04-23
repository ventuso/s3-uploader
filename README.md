# AWS S3 Image Uploader

Resize, rename, and upload images to Amazon S3 disk storage, promise awareness . Uses the official [AWS Node SDK](http://aws.amazon.com/sdkfornodejs/)  and [GM](https://github.com/aheckmann/gm)  for image processing.

## Install
Using npm

	npm install git://github.com/ventuso/s3-uploader.git

Or add this line to *package.json*

	"ventuso-s3-uploader": "git://github.com/ventuso/s3-uploader.git"

## Usage
	var Upload = require('ventuso-s3-uploader');

#### new Upload(string awsBucketName, object opts)
 - **string** *awsBucketName*  - name of Amazon S3 bucket.
 - **object** *opts* - global upload options.
    - **boolean** *override* - Override if file has already existed
	- **number** *resizeQuality* - thumbnail resize quality (**default** *100*).
	- **boolean** *returnExif* - return exif data for original image (**default** *false*).
	- **string** *tmpDir* - directory to store temporary files (**default** *os.tmpdir()*).
	- **string** *url* - custom public url (**default** build from *region* and *awsBucketName*).
	- **object** *aws* - AWS SDK configuration option
		- **string** *region* - region for you bucket , list of available regions are: *us-east-1, us-west-2, us-west-1, eu-west-1, eu-central-1, ap-southeast-1, ap-southeast-2, ap-northeast-1, sa-east-1* (**default** *us-east-1*)
		- **string** *path* - path within your bucket, (**default** "")		
		- **string** *acl* - default ACL for uploaded images, list of available ACL are: *private, public-read, public-read-write, authenticated-read, bucket-owner-read, bucket-owner-full-control* (**default** *private*)
		- **string** *accessKeyId* - AWS access key ID override
		- **string** *secretAccessKey* - AWS secret access key override

	- **object[]** *versions* - versions to upload to S3
		- **boolean** *original* - set this to true to save the original image
		- **string** *suffix* - this is appended to the file name (**default** "")
		- **number** *quality* - resize image quality (**default** *resizeQuality*)
		- **number** *maxWidth* - max width for resize image
		- **number** *maxHeight* - max height for resize image
		- **boolean** *keep* - keep resize version after upload
		- **boolean** *force* - Force scale up if the original image size is lesser than *maxWith* or *maxHeight*

	- **function** *pathGenerator* -  custom path generator function
	- **function** *nameGenerator* - custom name generator function

#### #upload(string src, object opts) return a Promise
 - **string** *src* - absolute path to source image to upload
 - **object** *opts* - upload config options
	- **string** *path* - local override for *opts.aws.path*
	- **string** *name* - local override for file name
 - return **object[]** *files* - list of file's information which were uploaded
    - **boolean** *original* - *true* if it's original image
    - **boolean** *keep* - *true* if file was kept after upload
    - **boolean** *force* - *true* if image was force scale up
    - **number** *quality* - Image quality
    - **string** *format* - Image's extension
    - **string** *size* - Image's size (original image only)
    - **number** *width* - Image's width
    - **number** *height* - Image's height
    - **string** *etag* - Image's ETag
    - **string** *src* - Absolute path to source image
    - **string** *url* - Absolute path to uploaded image
    - **string** *path* - relative path to uploaded image