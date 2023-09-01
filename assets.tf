resource "aws_s3_bucket_object" "babybowser_font" {
  bucket       = aws_s3_bucket.wedding_site.id
  key          = "fonts/babybowser"
  source       = "./static/assets/fonts/babybowser.ttf"
  etag         = filemd5("./static/assets/fonts/babybowser.ttf") // we want re deploy when this updates
  content_type = "font/ttf"
}
