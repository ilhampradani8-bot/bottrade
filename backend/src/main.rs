mod get_data;
mod strategies;
mod server;
mod api_exchange;

#[tokio::main]
async fn main() {
    server::api::start().await;
}
