data "archive_file" "edge_source" {
  type        = "zip"
  output_path = "edge.zip"

  source {
    content  = file("./edge.js")
    filename = "edge.js"
  }
}

resource "aws_lambda_function" "edge_lambda" {
  provider = aws.us-east-1
  filename      = "edge.zip"
  function_name = "edge"
  role          = aws_iam_role.resources_rw.arn
  handler       = "edge.handler"
  publish       = true
  source_code_hash = data.archive_file.edge_source.output_base64sha256

  runtime = "nodejs18.x"
}

resource "aws_cloudwatch_log_group" "edge_cw_group" {
  name = "/aws/lambda/${aws_lambda_function.edge_lambda.function_name}"

  retention_in_days = 30
}
