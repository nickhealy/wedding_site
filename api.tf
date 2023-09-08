resource "aws_apigatewayv2_api" "wedding_site" {
  name          = "wedding-site-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_credentials = true
    allow_headers     = ["content-type"]
    allow_methods     = ["GET", "PUT", "POST", "PATCH", "OPTIONS"]
    allow_origins     = ["http://localhost:8000", "https://${var.www_domain_name}", "https://${var.root_domain_name}"]
  }
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
      jsonencode(aws_apigatewayv2_stage.default),
      jsonencode(aws_apigatewayv2_api.wedding_site),
      jsonencode(aws_apigatewayv2_integration.login),
      jsonencode(aws_apigatewayv2_route.login),
    ])))
  }

  lifecycle {
    create_before_destroy = true
  }
}
resource "aws_apigatewayv2_api_mapping" "api" {
  api_id      = aws_apigatewayv2_api.wedding_site.id
  domain_name = aws_apigatewayv2_domain_name.api.id
  stage       = aws_apigatewayv2_stage.default.id
}

resource "aws_acm_certificate_validation" "api-cert" {
  certificate_arn         = aws_acm_certificate.api-cert.arn
  validation_record_fqdns = [for record in aws_route53_record.api_cert_validation : record.fqdn]
}

resource "aws_acm_certificate" "api-cert" {
  domain_name       = var.root_domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
  subject_alternative_names = ["api.${var.root_domain_name}"]
}

resource "aws_route53_record" "api_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.api-cert.domain_validation_options : dvo.domain_name => {
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


resource "aws_apigatewayv2_domain_name" "api" {
  domain_name = "api.${ var.root_domain_name }"

  domain_name_configuration {
    certificate_arn = aws_acm_certificate.api-cert.arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }

  depends_on = [aws_acm_certificate_validation.api-cert]
}
resource "aws_route53_record" "api" {
  allow_overwrite = true
  name            = aws_apigatewayv2_domain_name.api.domain_name
  type            = "A"
  zone_id         = data.aws_route53_zone.route53_zone.zone_id

  alias {
    name                   = aws_apigatewayv2_domain_name.api.domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.api.domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}




resource "aws_apigatewayv2_integration" "login" {
  api_id                 = aws_apigatewayv2_api.wedding_site.id
  integration_uri        = aws_lambda_function.login_lambda.invoke_arn
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
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
