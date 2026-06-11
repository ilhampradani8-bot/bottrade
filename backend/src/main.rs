mod get_data;
mod strategies;
mod server;
mod api_exchange;
pub mod realtime_sim;

#[tokio::main]
async fn main() {
    server::api::start().await;
}
