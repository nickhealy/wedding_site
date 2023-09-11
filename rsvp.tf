data "archive_file" "rsvp_source" {
  type        = "zip"
  output_path = "rsvp.zip"

  source {
    content  = file("./rsvp.js")
    filename = "rsvp.js"
  }
}

resource "aws_lambda_function" "rsvp_lambda" {
  filename      = "rsvp.zip"
  function_name = "rsvp"
  role          = aws_iam_role.resources_rw.arn
  handler       = "rsvp.handler"
  publish       = true
  source_code_hash = data.archive_file.rsvp_source.output_base64sha256

  runtime = "nodejs18.x"

  environment {
    variables = {
      RESOURCES_BUCKET = var.resources_bucket_name
    }
  }
}

resource "aws_cloudwatch_log_group" "rsvp_cw_group" {
  name = "/aws/lambda/${aws_lambda_function.rsvp_lambda.function_name}"

  retention_in_days = 30
}
