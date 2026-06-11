use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use serde::{Serialize};
use crate::server::api::AppState;
use crate::server::postgres_auth_hub::Claims;
use std::env;
use ts_rs::TS;
use rust_decimal::Decimal;

#[derive(Serialize, TS)]
#[ts(export, export_to = "../../frontend/src/types/OverviewData.ts")]
pub struct OverviewData {
    pub total_capital: f64,
    pub active_bots: i64,
    pub inactive_bots: i64,
    pub connected_accounts: Vec<AccountInfo>,
    pub performance_history: Vec<PerformancePoint>,
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../../frontend/src/types/AccountInfo.ts")]
pub struct AccountInfo {
    pub platform: String,
    pub label: String,
    pub balance: f64,
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../../frontend/src/types/PerformancePoint.ts")]
pub struct PerformancePoint {
    pub date: String,
    pub profit: f64,
}

pub async fn get_overview(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
) -> (StatusCode, Json<OverviewData>) {
    let user_id = match get_user_id_from_headers(headers).await {
        Some(id) => id,
        None => return (StatusCode::UNAUTHORIZED, Json(OverviewData {
            total_capital: 0.0,
            active_bots: 0,
            inactive_bots: 0,
            connected_accounts: vec![],
            performance_history: vec![],
        })),
    };

    // 1. Get stats from strategies
    let stats = sqlx::query!(
        r#"
        SELECT 
            COUNT(*) FILTER (WHERE status = 'active') as active_count,
            COUNT(*) FILTER (WHERE status != 'active') as inactive_count
        FROM strategies_by_strategysettings 
        WHERE user_id = $1
        "#,
        user_id
    )
    .fetch_one(&state.pool)
    .await
    .ok();

    // 2. Get total capital (sum nominal from settings)
    let strategies = sqlx::query!(
        "SELECT settings FROM strategies_by_strategysettings WHERE user_id = $1",
        user_id
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let mut total_capital = 0.0;
    for s in strategies {
        if let Some(nominal_str) = s.settings.get("nominal").and_then(|v| v.as_str()) {
            if let Ok(val) = nominal_str.replace(",", "").parse::<f64>() {
                total_capital += val;
            }
        }
    }

    // 3. Get connected accounts
    let accounts = sqlx::query!(
        "SELECT platform_name, label FROM api_keys_by_credential WHERE user_id = $1",
        user_id
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default()
    .into_iter()
    .map(|a| AccountInfo {
        platform: a.platform_name,
        label: a.label,
        balance: 0.0,
    })
    .collect();

    // 4. Get performance history
    let performance = sqlx::query!(
        "SELECT total_balance, logged_at FROM performance_logs_by_overview WHERE user_id = $1 ORDER BY logged_at ASC LIMIT 30",
        user_id
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default()
    .into_iter()
    .map(|p| {
        let balance = p.total_balance.unwrap_or(Decimal::ZERO);
        let date = p.logged_at.map(|t| t.format("%Y-%m-%d").to_string()).unwrap_or_default();
        PerformancePoint {
            date,
            profit: balance.to_string().parse().unwrap_or(0.0),
        }
    })
    .collect();

    (StatusCode::OK, Json(OverviewData {
        total_capital,
        active_bots: stats.as_ref().map(|s| s.active_count).flatten().unwrap_or(0),
        inactive_bots: stats.as_ref().map(|s| s.inactive_count).flatten().unwrap_or(0),
        connected_accounts: accounts,
        performance_history: performance,
    }))
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
