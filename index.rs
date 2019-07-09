use http::{Request, Response, StatusCode};
use reqwest::{Client, header};
use std::env;
use url::Url;

fn handler(req: Request<String>) -> http::Result<Response<String>> {
    let access_token = env::var("GH_ACCESS_TOKEN").expect("Failed to load access token");
    let api_prefix = "https://api.github.com/repos/tdemapp/registry/contents/extensions";
    let client = Client::new();

    let url = match req.uri().path() {
        "/" => api_prefix.to_string(),
        _ => format!("{}{}.json", api_prefix, req.uri().path())
    };
    let url = Url::parse(&url).expect("Failed to parse URL");

    let mut fetch = client
        .get(url)
        .header("Authorization", format!("token {}", access_token))
        .send()
        .expect("Failed to fetch from GitHub");

    assert_eq!(fetch.status(), StatusCode::OK);

    let body = fetch.text().expect("Failed unwrapping fetch body");
    let body_str = serde_json::to_string(&body).expect("Failed to serialize to JSON");

    let response = Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "application/json")
        .body(body_str)
        .expect("Failed to generate response");

    Ok(response)
}
