use axum::{
    extract::{State, Path},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use crate::server::api::AppState;
use crate::server::postgres_auth_hub::Claims;
use std::env;
use ts_rs::TS;

#[derive(Deserialize, Serialize, TS)]
#[ts(export, export_to = "../../frontend/src/types/SaveSimulationRequest.ts")]
pub struct SaveSimulationRequest {
    pub name: String,
    pub bot_type: String,
    pub pair: String,
    pub settings: serde_json::Value,
}

#[derive(Deserialize)]
pub struct ToggleStatusRequest {
    pub status: String,
}

pub async fn save_simulation(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
    Json(payload): Json<SaveSimulationRequest>,
) -> (StatusCode, Json<serde_json::Value>) {
    let user_id = match get_user_id_from_headers(&headers).await {
        Some(id) => id,
        None => return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"error": "Unauthorized"}))),
    };

    let result = sqlx::query!(
        "INSERT INTO simulations_by_simsettings (user_id, name, bot_type, pair, settings, status) VALUES ($1, $2, $3, $4, $5, 'active')",
        user_id,
        payload.name,
        payload.bot_type,
        payload.pair,
        payload.settings
    )
    .execute(&state.pool)
    .await;

    match result {
        Ok(_) => (StatusCode::CREATED, Json(serde_json::json!({"status": "success", "message": "Simulation saved successfully"}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
    }
}

pub async fn get_user_simulations(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
) -> (StatusCode, Json<Vec<serde_json::Value>>) {
    let user_id = match get_user_id_from_headers(&headers).await {
        Some(id) => id,
        None => return (StatusCode::UNAUTHORIZED, Json(vec![])),
    };

    let rows = sqlx::query!(
        "SELECT id, name, bot_type, pair, settings, status, created_at FROM simulations_by_simsettings WHERE user_id = $1 ORDER BY id DESC",
        user_id
    )
    .fetch_all(&state.pool)
    .await;

    match rows {
        Ok(data) => {
            let list = data.into_iter().map(|r| {
                serde_json::json!({
                    "id": r.id,
                    "name": r.name,
                    "bot_type": r.bot_type,
                    "pair": r.pair,
                    "settings": r.settings,
                    "status": r.status.unwrap_or_else(|| "inactive".to_string()),
                    "created_at": r.created_at
                })
            }).collect();
            (StatusCode::OK, Json(list))
        }
        Err(_) => (StatusCode::OK, Json(vec![]))
    }
}

pub async fn toggle_simulation_status(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
    Path(id): Path<i32>,
    Json(payload): Json<ToggleStatusRequest>,
) -> (StatusCode, Json<serde_json::Value>) {
    let user_id = match get_user_id_from_headers(&headers).await {
        Some(id) => id,
        None => return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"error": "Unauthorized"}))),
    };

    let result = sqlx::query!(
        "UPDATE simulations_by_simsettings SET status = $1 WHERE id = $2 AND user_id = $3",
        payload.status,
        id,
        user_id
    )
    .execute(&state.pool)
    .await;

    match result {
        Ok(_) => (StatusCode::OK, Json(serde_json::json!({"status": "success"}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
    }
}

pub async fn delete_simulation(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
    Path(id): Path<i32>,
) -> (StatusCode, Json<serde_json::Value>) {
    let user_id = match get_user_id_from_headers(&headers).await {
        Some(id) => id,
        None => return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"error": "Unauthorized"}))),
    };

    let result = sqlx::query!(
        "DELETE FROM simulations_by_simsettings WHERE id = $1 AND user_id = $2",
        id,
        user_id
    )
    .execute(&state.pool)
    .await;

    match result {
        Ok(_) => (StatusCode::OK, Json(serde_json::json!({"status": "success"}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
    }
}

pub async fn get_simulation_trades(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
) -> (StatusCode, Json<Vec<serde_json::Value>>) {
    let user_id = match get_user_id_from_headers(&headers).await {
        Some(id) => id,
        None => return (StatusCode::UNAUTHORIZED, Json(vec![])),
    };

    let rows = sqlx::query!(
        "SELECT id, pair, strategy_type, side, price, amount, pnl, currency, created_at FROM simulation_trades_by_jurnal WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
        user_id
    )
    .fetch_all(&state.pool)
    .await;

    match rows {
        Ok(data) => {
            let list = data.into_iter().map(|r| {
                serde_json::json!({
                    "id": r.id,
                    "pair": r.pair,
                    "strategy_type": r.strategy_type,
                    "side": r.side,
                    "price": r.price.to_string(),
                    "amount": r.amount.to_string(),
                    "pnl": r.pnl.map(|p| p.to_string()),
                    "currency": r.currency.unwrap_or_else(|| "IDR".to_string()),
                    "created_at": r.created_at
                })
            }).collect();
            (StatusCode::OK, Json(list))
        }
        Err(_) => (StatusCode::OK, Json(vec![]))
    }
}

async fn get_user_id_from_headers(headers: &axum::http::HeaderMap) -> Option<i32> {
    let auth_header = headers.get("Authorization")?.to_str().ok()?;
    let token = auth_header.replace("Bearer ", "");
    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "secret".into());
    
    let token_data = jsonwebtoken::decode::<Claims>(
        &token,
        &jsonwebtoken::DecodingKey::from_secret(secret.as_ref()),
        &jsonwebtoken::Validation::default(),
    ).ok()?;

    Some(token_data.claims.sub)
}
