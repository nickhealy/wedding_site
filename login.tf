resource "aws_s3_bucket" "wedding_site_resources" {
  bucket = var.resources_bucket_name
  tags = {
    Name        = "site-resources"
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

resource "aws_s3_bucket_versioning" "rsvps" {
  bucket = aws_s3_bucket.wedding_site_resources.id
  versioning_configuration {
    status = "Enabled"
  }
}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type = "Service"
      // should probably give edge  its own assume role, but i want to keep it simple here
      identifiers = ["lambda.amazonaws.com", "edgelambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

data "aws_iam_policy_document" "resources_rw" {
  statement {
    actions = [
      "s3:ListBucket",
      "s3:GetObject",
      "s3:PutObject"
    ]

    resources = [
      "arn:aws:s3:::${var.resources_bucket_name}",
      "arn:aws:s3:::${var.resources_bucket_name}/*",
    ]
  }
}

resource "aws_iam_role" "resources_rw" {
  name               = "resources_rw"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  inline_policy {
    name   = "read-write-resources-policy"
    policy = data.aws_iam_policy_document.resources_rw.json
  }
}

resource "aws_iam_role_policy_attachment" "cloudwatch_role" {
  role       = aws_iam_role.resources_rw.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}


data "archive_file" "login_source" {
  type        = "zip"
  output_path = "login.zip"

  source {
    content  = file("./login.js")
    filename = "login.js"
  }

  source {
    content  = file("./db.js")
    filename = "./db.js"
  }
}

resource "aws_iam_role" "login" {
  name               = "login"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  inline_policy {
    name   = "read-write-sessions-policy"
    policy = data.aws_iam_policy_document.sessions_rw.json
  }
  inline_policy {
    name   = "write-guestlist-policy"
    policy = data.aws_iam_policy_document.guest_list_r.json
  }
}

resource "aws_iam_role_policy_attachment" "login_cloudwatch_role" {
  role       = aws_iam_role.login.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "login_lambda" {
  filename      = "login.zip"
  function_name = "login"
  role          = aws_iam_role.login.arn
  handler       = "login.handler"

  source_code_hash = data.archive_file.login_source.output_base64sha256

  runtime = "nodejs18.x"

  environment {
    variables = {
      SITE_PASSWORD       = var.site_password
      SESSIONS_TABLE_NAME = aws_dynamodb_table.sessions.name
      GUEST_LIST_TABLE_NAME = aws_dynamodb_table.guest_data.name
    }
  }
}

resource "aws_cloudwatch_log_group" "login_cw_group" {
  name = "/aws/lambda/${aws_lambda_function.login_lambda.function_name}"

  retention_in_days = 30
}

