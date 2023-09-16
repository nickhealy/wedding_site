variable "csv_upload_api_key" {
  
}
data "archive_file" "csv_upload_source" {
  type        = "zip"
  output_path = "csv-upload.zip"

  source {
    content  = file("./csv-upload.js")
    filename = "csv-upload.js"
  }
}

resource "aws_lambda_function" "csv_upload_lambda" {
  filename      = "csv-upload.zip"
  function_name = "csv_upload"
  role          = aws_iam_role.resources_rw.arn
  handler       = "csv-upload.handler"
  publish       = true
  source_code_hash = data.archive_file.csv_upload_source.output_base64sha256

  runtime = "nodejs18.x"

  environment {
    variables = {
      RESOURCES_BUCKET = var.resources_bucket_name
      API_KEY = var.csv_upload_api_key
    }
  }
}

resource "aws_cloudwatch_log_group" "csv_upload_cw_group" {
  name = "/aws/lambda/${aws_lambda_function.csv_upload_lambda.function_name}"

  retention_in_days = 30
}
