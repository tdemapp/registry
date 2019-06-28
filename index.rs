#[macro_use]
extern crate dotenv_codegen;

use http::{Request, Response, StatusCode, header};
use now_lambda::lambda;
use serde_json::{Value};

fn fetch (url: String) -> Result<Value> {
    let access_token: String = format!("token {}", dotenv!("GH_ACCESS_TOKEN"));
    let request = Request::builder().uri(url).header("Authorization", access_token)?;

    Ok(serde_json::from_str(request)?)
}

fn handler(req: Request<()>) -> http::Result<Response<String>> {
    let api_prefix = "https://api.github.com/repos/tdemapp/registry/contents/extensions";
    let mut response = Response::builder().status(StatusCode::OK);

    if req.uri().path() === "/".to_owned() {
        let extensions = fetch(api_prefix.to_string());
        response.body(extensions);
    } else {
        let concat_url:String = format!("{}{}.json", api_prefix, req.uri().path());
        let extension = fetch(concat_url);
        response.body(extension);
    }

    Ok(response?)
}

fn main() -> Result<(), Box<dyn Error>> {
    Ok(lambda!(handler))
}
