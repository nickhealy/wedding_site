resource "aws_dynamodb_table" "guest_data" {
  name         = "guest-data"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "N"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name = "EmailIndex"
    hash_key = "email"
    projection_type = "INCLUDE"
    non_key_attributes = ["rsvpd"]
  }


}

data "aws_iam_policy_document" "guest_list_r" {
  statement {
    actions = [
      "dynamodb:ConditionCheckItem",
      "dynamodb:DescribeTable",
      "dynamodb:GetItem",
    ]

    resources = [
      aws_dynamodb_table.guest_data.arn
    ]
  }
  statement {
    actions = [
      "dynamodb:Query",
    ]

    resources = [
      "${aws_dynamodb_table.guest_data.arn}/index/*"
    ]
  }
}
