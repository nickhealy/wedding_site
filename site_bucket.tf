resource "aws_s3_bucket" "wedding_site" {
  bucket = var.website_bucket_name

  tags = {
    Name        = "Wedding site"
    Environment = "Prod"
  }
}

resource "aws_s3_bucket_website_configuration" "wedding_site_config" {
  bucket = aws_s3_bucket.wedding_site.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}
resource "aws_s3_bucket_public_access_block" "disable_block_acls" {
  bucket = aws_s3_bucket.wedding_site.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "allow_public_read_policy" {
  bucket = aws_s3_bucket.wedding_site.id
  policy = data.aws_iam_policy_document.allow_public_read_policy_document.json
}

data "aws_iam_policy_document" "allow_public_read_policy_document" {
  statement {
    sid = "PublicReadGetObject"

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions = [
      "s3:GetObject",
    ]

    resources = [
      "${aws_s3_bucket.wedding_site.arn}/*",
    ]
  }
}

# this is maybe not necessary if we have a deploy script, but here we go
resource "aws_s3_bucket_object" "index" {
  bucket = aws_s3_bucket.wedding_site.id
  key    = "index.html"
  source = "./index.html"
  etag   = filemd5("index.html")
  content_type = "text/html"
}

resource "aws_s3_bucket_object" "error" {
  bucket = aws_s3_bucket.wedding_site.id
  key    = "error.html"
  source = "./error.html"
  etag   = filemd5("error.html")
  content_type = "text/html"
}

