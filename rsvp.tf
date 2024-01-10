data "archive_file" "rsvp_source" {
  type        = "zip"
  output_path = "rsvp.zip"

  source {
    content  = file("./rsvp.js")
    filename = "rsvp.js"
  }
  source {
    content  = file("./db.js")
    filename = "db.js"
  }
  source {
    content  = file("./csv.js")
    filename = "csv.js"
  }
}

resource "aws_lambda_function" "rsvp_lambda" {
  filename      = "rsvp.zip"
  function_name = "rsvp"
  role          = aws_iam_role.rsvp.arn
  handler       = "rsvp.handler"
  publish       = true
  source_code_hash = data.archive_file.rsvp_source.output_base64sha256

  runtime = "nodejs18.x"

  environment {
    variables = {
      GUEST_LIST_TABLE_NAME = aws_dynamodb_table.guest_data.name
      RESOURCES_BUCKET = var.resources_bucket_name
    }
  }
}

resource "aws_iam_role" "rsvp" {
  name               = "rsvp-upload"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  inline_policy {
    name   = "write-guestlist-policy"
    policy = data.aws_iam_policy_document.guest_list_w.json
  }
  inline_policy {
    name   = "read-guestlist-policy"
    policy = data.aws_iam_policy_document.guest_list_r.json
  }
}

resource "aws_iam_role_policy_attachment" "rsvp_upload_cloudwatch_role" {
  role       = aws_iam_role.rsvp.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_cloudwatch_log_group" "rsvp_cw_group" {
  name = "/aws/lambda/${aws_lambda_function.rsvp_lambda.function_name}"

  retention_in_days = 30
}
