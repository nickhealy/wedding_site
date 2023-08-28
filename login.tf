resource "aws_s3_bucket" "wedding_site_resources" {
  bucket = var.resources_bucket_name
  tags = {
    Name        = "Site resources"
    Environment = "Prod"
  }
}

resource "aws_s3_bucket_public_access_block" "disable_block_acls_resources" {
  bucket = aws_s3_bucket.wedding_site_resources.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}


# authentication/guest level access

resource "aws_s3_bucket_object" "guest_list" {
  bucket       = aws_s3_bucket.wedding_site_resources.id
  key          = "guest_list.json"
  source       = "guest_list.json"
  etag         = filemd5("guest_list.json")
  content_type = "application/json"
}

data "aws_iam_policy_document" "login_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

data "aws_iam_policy_document" "read_s3_policy" {
  statement {
    actions = [
      "s3:ListBucket",
      "s3:GetObject",
    ]

    resources = [
      "arn:aws:s3:::${var.resources_bucket_name}",
      "arn:aws:s3:::${var.resources_bucket_name}/*",
    ]
  }
}

resource "aws_iam_role" "login_role" {
  name               = "login_role"
  assume_role_policy = data.aws_iam_policy_document.login_assume_role.json
  inline_policy {
    name = "read-guest-list-policy"
    policy = data.aws_iam_policy_document.read_s3_policy.json
  }
}

data "archive_file" "login_source" {
  type        = "zip"
  source_file = "login.js"
  output_path = "login.zip"
}

resource "aws_lambda_function" "login_lambda" {
  filename      = "login.zip"
  function_name = "login"
  role          = aws_iam_role.login_role.arn
  handler       = "login.handler"

  source_code_hash = data.archive_file.login_source.output_base64sha256

  runtime = "nodejs18.x"

  environment {
    variables = {
      SITE_PASSWORD = var.site_password
      RESOURCES_BUCKET = var.resources_bucket_name
    }
  }
}
