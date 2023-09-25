data "archive_file" "edge_source" {
  type        = "zip"
  output_path = "edge.zip"

  source {
    content  = file("./edge.js")
    filename = "edge.js"
  }

  source {
    content = file("./static/handlebars.min-v4.7.8.js")
    filename = "./handlebars.min-v4.7.8.js"
  }

  source {
    content = file("./handlebars.js")
    filename = "handlebars.js"
  }

  source {
    content = file("./static/main.handlebars.html")
    filename = "main.handlebars.html"
  }

  source {
    content = file("./db.js")
    filename = "db.js"
  }
  source {
    content = file("./csv.js")
    filename = "./csv.js"
  }
}

resource "aws_lambda_function" "edge_lambda" {
  provider = aws.us-east-1
  filename      = "edge.zip"
  function_name = "edge"
  role          = aws_iam_role.edge.arn
  handler       = "edge.handler"
  publish       = true
  source_code_hash = data.archive_file.edge_source.output_base64sha256

  runtime = "nodejs18.x"
}

resource "aws_cloudwatch_log_group" "edge_cw_group" {
  name = "/aws/lambda/${aws_lambda_function.edge_lambda.function_name}"

  retention_in_days = 30
}

resource "aws_iam_role" "edge" {
  name               = "edge"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  inline_policy {
    name   = "read-guestlist-policy"
    policy = data.aws_iam_policy_document.guest_list_r.json
  }
  inline_policy {
    name = "sessions-rw" // technically does not need to write, but whatever
    policy = data.aws_iam_policy_document.sessions_rw.json
  }
}

resource "aws_iam_role_policy_attachment" "edge_cloudwatch_role" {
  role       = aws_iam_role.edge.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
