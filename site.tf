provider "aws" {
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
  region     = var.aws_region
}

provider "aws" {
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
  region     = "us-east-1"
  alias      = "us-east-1"
}

variable "www_domain_name" {}
variable "root_domain_name" {}
variable "resources_bucket_name" {}
variable "aws_region" {}
variable "aws_access_key" {}
variable "aws_secret_key" {}
variable "site_password" {}


resource "aws_s3_bucket" "www" {
  // Our bucket's name is going to be the same as our site's domain name.
  bucket = var.www_domain_name

  website {
    index_document = "login.html"
    error_document = "error.html"
  }


}

resource "aws_s3_bucket_policy" "my_bucket_policy" {
  bucket = aws_s3_bucket.www.id
  policy = data.aws_iam_policy_document.bucket_policy.json
}

data "aws_iam_policy_document" "bucket_policy" {
  statement {
    actions = [
      "s3:GetObject"
    ]

    principals {
      type        = "AWS"
      identifiers = ["${aws_cloudfront_origin_access_identity.cf_oai.iam_arn}"]
    }

    resources = [
      "${aws_s3_bucket.www.arn}",
      "${aws_s3_bucket.www.arn}/*"
    ]
  }
}

# Define a map to specify the content type for each file extension
locals {
  content_types = {
    ".html" = "text/html",
    ".css"  = "text/css",
    ".js"   = "application/javascript",
    ".ttf" = "font/ttf"
  }
}

resource "aws_s3_bucket_object" "static_assets" {
  bucket   = aws_s3_bucket.www.id
  for_each = fileset("${path.module}/static", "**")

  key    = each.key
  source = "${path.module}/static/${each.key}"
  etag   = filemd5("${path.module}/static/${each.key}")
  #  gets last element of split string as file type, then gets the content type from the map
  content_type = try(local.content_types[".${element(split(".", each.key), length(split(".", each.key)) - 1)}"], "application/octet-stream")
}

resource "aws_s3_bucket_object" "error" {
  bucket       = aws_s3_bucket.www.id
  key          = "error.html"
  source       = "./error.html"
  etag         = filemd5("error.html")
  content_type = "text/html"
}


data "aws_route53_zone" "route53_zone" {
  name         = var.root_domain_name
  private_zone = false
}

resource "aws_acm_certificate" "cert" {
  provider          = aws.us-east-1
  domain_name       = var.root_domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
  subject_alternative_names = [var.www_domain_name]
}

resource "aws_route53_record" "root" {
  allow_overwrite = true
  name            = var.root_domain_name
  type            = "A"
  zone_id         = data.aws_route53_zone.route53_zone.zone_id

  alias {
    name                   = aws_cloudfront_distribution.www_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.www_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www" {
  allow_overwrite = true
  name            = var.www_domain_name
  type            = "A"
  zone_id         = data.aws_route53_zone.route53_zone.zone_id

  alias {
    name                   = aws_cloudfront_distribution.www_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.www_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  zone_id         = data.aws_route53_zone.route53_zone.zone_id
  ttl             = 60
}

resource "aws_acm_certificate_validation" "cert" {
  provider                = aws.us-east-1
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

resource "aws_cloudfront_origin_access_identity" "cf_oai" {
  comment = "OAI for cloudfront"
}

resource "aws_cloudfront_distribution" "www_distribution" {
  provider = aws.us-east-1
  // origin is where CloudFront gets its content from.
  origin {
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.cf_oai.cloudfront_access_identity_path
    }

    domain_name = aws_s3_bucket.www.bucket_domain_name
    origin_id   = var.www_domain_name
  }

  enabled             = true
  default_root_object = "login.html"

  aliases = [var.root_domain_name, var.www_domain_name]

  // All values are defaults from the AWS console.
  default_cache_behavior {
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    // This needs to match the `origin_id` above.
    target_origin_id = var.www_domain_name
    min_ttl          = 0
    default_ttl      = 86400
    max_ttl          = 31536000

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate_validation.cert.certificate_arn
    ssl_support_method  = "sni-only"
  }

}

