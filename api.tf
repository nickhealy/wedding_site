resource "aws_apigatewayv2_api" "wedding_site" {
  name          = "wedding-site-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id = aws_apigatewayv2_api.wedding_site.id
  name   = "$default"
}

resource "aws_apigatewayv2_deployment" "wedding_site" {
  api_id      = aws_apigatewayv2_api.wedding_site.id
  description = "wedding_site"

  triggers = {
    redeployment = sha1(join(",", tolist([
      jsonencode(aws_apigatewayv2_integration.login),
      jsonencode(aws_apigatewayv2_route.login),
    ])))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_apigatewayv2_integration" "login" {
  api_id             = aws_apigatewayv2_api.wedding_site.id
  integration_uri    = aws_lambda_function.login_lambda.invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "login" {
  api_id = aws_apigatewayv2_api.wedding_site.id

  route_key = "POST /login"
  target    = "integrations/${aws_apigatewayv2_integration.login.id}"
}

resource "aws_cloudwatch_log_group" "api_gw" {
  name              = "/aws/api_gw/${aws_apigatewayv2_api.wedding_site.name}"
  retention_in_days = 30
}

resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.login_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.wedding_site.execution_arn}/*/*"
}
