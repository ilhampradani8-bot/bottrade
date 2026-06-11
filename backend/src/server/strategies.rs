use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use crate::server::api::AppState;
use crate::server::postgres_auth_hub::Claims;
use std::env;
use ts_rs::TS;

#[derive(Deserialize, Serialize, TS)]
#[ts(export, export_to = "../../frontend/src/types/SaveStrategyRequest.ts")]
pub struct SaveStrategyRequest {
    pub name: String,
    pub bot_type: String,
    pub pair: String,
    pub settings: serde_json::Value,
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../../frontend/src/types/ApiKeyInfo.ts")]
pub struct ApiKeyInfo {
    pub id: i32,
    pub platform_name: String,
    pub label: String,
}

pub async fn save_strategy(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
    Json(payload): Json<SaveStrategyRequest>,
) -> (StatusCode, Json<serde_json::Value>) {
    let user_id = match get_user_id_from_headers(headers).await {
        Some(id) => id,
        None => return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"error": "Unauthorized"}))),
    };

    // Extract values from settings JSON
    let safety_nominal = payload.settings.get("safety_nominal")
        .and_then(|v| v.as_str())
        .and_then(|s| s.replace(",", "").parse::<f64>().ok());
    
    let interval_unit = payload.settings.get("interval_unit")
        .and_then(|v| v.as_str());

    let take_profit = payload.settings.get("take_profit")
        .and_then(|v| v.as_str())
        .and_then(|s| s.parse::<f64>().ok());

    let stop_loss = payload.settings.get("stop_loss")
        .and_then(|v| v.as_str())
        .and_then(|s| s.parse::<f64>().ok());

    let result = sqlx::query!(
        "INSERT INTO strategies_by_strategysettings (user_id, name, bot_type, pair, settings, safety_order_nominal, interval_unit, take_profit_percentage, stop_loss_percentage) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        user_id,
        payload.name,
        payload.bot_type,
        payload.pair,
        payload.settings,
        safety_nominal as Option<f64>,
        interval_unit as Option<&str>,
        take_profit as Option<f64>,
        stop_loss as Option<f64>
    )
    .execute(&state.pool)
    .await;

    match result {
        Ok(_) => (StatusCode::CREATED, Json(serde_json::json!({"status": "success", "message": "Strategy saved successfully"}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
    }
}

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../../frontend/src/types/SaveApiKeyRequest.ts")]
pub struct SaveApiKeyRequest {
    pub platform_name: String,
    pub label: String,
    pub api_key: String,
    pub api_secret: String,
}

pub async fn save_api_key(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
    Json(payload): Json<SaveApiKeyRequest>,
) -> (StatusCode, Json<serde_json::Value>) {
    let user_id = match get_user_id_from_headers(headers).await {
        Some(id) => id,
        None => return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"error": "Unauthorized"}))),
    };

    let result = sqlx::query!(
        "INSERT INTO api_keys_by_credential (user_id, platform_name, label, api_key, api_secret) VALUES ($1, $2, $3, $4, $5)",
        user_id,
        payload.platform_name,
        payload.label,
        payload.api_key,
        payload.api_secret
    )
    .execute(&state.pool)
    .await;

    match result {
        Ok(_) => (StatusCode::CREATED, Json(serde_json::json!({"status": "success", "message": "API Key saved successfully"}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
    }
}

pub async fn get_api_keys(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
) -> (StatusCode, Json<Vec<ApiKeyInfo>>) {
    let user_id = match get_user_id_from_headers(headers).await {
        Some(id) => id,
        None => return (StatusCode::UNAUTHORIZED, Json(vec![])),
    };

    let keys = sqlx::query_as!(
        ApiKeyInfo,
        "SELECT id, platform_name, label FROM api_keys_by_credential WHERE user_id = $1",
        user_id
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    (StatusCode::OK, Json(keys))
}

pub async fn get_user_strategies(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
) -> (StatusCode, Json<Vec<serde_json::Value>>) {
    let user_id = match get_user_id_from_headers(headers).await {
        Some(id) => id,
        None => return (StatusCode::UNAUTHORIZED, Json(vec![])),
    };

    let rows = sqlx::query!(
        "SELECT id, name, bot_type, pair, settings, status, created_at FROM strategies_by_strategysettings WHERE user_id = $1 ORDER BY id DESC",
        user_id
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let list = rows.into_iter().map(|r| {
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

#[derive(Deserialize)]
pub struct ToggleStatusRequest {
    pub status: String,
}

pub async fn toggle_strategy_status(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
    axum::extract::Path(id): axum::extract::Path<i32>,
    Json(payload): Json<ToggleStatusRequest>,
) -> (StatusCode, Json<serde_json::Value>) {
    let user_id = match get_user_id_from_headers(headers).await {
        Some(id) => id,
        None => return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"error": "Unauthorized"}))),
    };

    let result = sqlx::query!(
        "UPDATE strategies_by_strategysettings SET status = $1 WHERE id = $2 AND user_id = $3",
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

pub async fn delete_strategy(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
    axum::extract::Path(id): axum::extract::Path<i32>,
) -> (StatusCode, Json<serde_json::Value>) {
    let user_id = match get_user_id_from_headers(headers).await {
        Some(id) => id,
        None => return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"error": "Unauthorized"}))),
    };

    let result = sqlx::query!(
        "DELETE FROM strategies_by_strategysettings WHERE id = $1 AND user_id = $2",
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

async fn get_user_id_from_headers(headers: axum::http::HeaderMap) -> Option<i32> {
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
