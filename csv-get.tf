data "archive_file" "csv_get_source" {
  type        = "zip"
  output_path = "csv-get.zip"

  source {
    content  = file("./csv-get.js")
    filename = "csv-get.js"
  }
  source {
    content  = file("./db.js")
    filename = "./db.js"
  }
  source {
    content  = file("./csv.js")
    filename = "./csv.js"
  }
  source {
    content  = file("./csv-db.js")
    filename = "./csv-db.js"
  }
}

resource "aws_lambda_function" "csv_get_lambda" {
  filename      = "csv-get.zip"
  function_name = "csv-get"
  role          = aws_iam_role.csv_get.arn
  handler       = "csv-get.handler"
  publish       = true
  source_code_hash = data.archive_file.csv_upload_source.output_base64sha256

  runtime = "nodejs18.x"

  environment {
    variables = {
      GUEST_LIST_TABLE_NAME = aws_dynamodb_table.guest_data.name
      API_KEY = var.csv_upload_api_key
    }
  }
}

resource "aws_cloudwatch_log_group" "csv_get_cw_group" {
  name = "/aws/lambda/${aws_lambda_function.csv_get_lambda.function_name}"

  retention_in_days = 30
}

resource "aws_iam_role" "csv_get" {
  name               = "csv-get"
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

resource "aws_iam_role_policy_attachment" "csv_get_cloudwatch_role" {
  role       = aws_iam_role.csv_get.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}


