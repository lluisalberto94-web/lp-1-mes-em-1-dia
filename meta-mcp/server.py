import os
from typing import Any, Literal
from urllib.parse import parse_qs

import httpx
from mcp.server import MCPServer
from mcp.server.transport_security import TransportSecuritySettings
from starlette.requests import Request
from starlette.responses import JSONResponse, PlainTextResponse, Response

SERVER_NAME = "Freire Meta Ads MCP"
GRAPH_ROOT = "https://graph.facebook.com"
DEFAULT_TIMEOUT = 30.0

mcp = MCPServer(SERVER_NAME)


def _token() -> str:
    value = os.getenv("META_ACCESS_TOKEN", "").strip()
    if not value:
        raise RuntimeError(
            "META_ACCESS_TOKEN is not configured. Add a Meta access token with ads_read permission."
        )
    return value


def _base_url() -> str:
    version = os.getenv("META_API_VERSION", "").strip().strip("/")
    return f"{GRAPH_ROOT}/{version}" if version else GRAPH_ROOT


def _normalize_ad_account_id(value: str | None) -> str:
    account_id = (value or os.getenv("META_DEFAULT_AD_ACCOUNT_ID", "")).strip()
    if not account_id:
        raise ValueError(
            "ad_account_id is required unless META_DEFAULT_AD_ACCOUNT_ID is configured."
        )
    return account_id if account_id.startswith("act_") else f"act_{account_id}"


def _clean_params(params: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in params.items() if v is not None and v != ""}


async def _graph_get(path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    url = f"{_base_url()}/{path.lstrip('/')}"
    headers = {"Authorization": f"Bearer {_token()}"}
    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
        response = await client.get(url, params=_clean_params(params or {}), headers=headers)
    try:
        payload = response.json()
    except ValueError:
        payload = {"error": {"message": response.text or "Non-JSON response from Meta"}}
    if response.is_error:
        error = payload.get("error", payload)
        raise RuntimeError(f"Meta API error ({response.status_code}): {error}")
    return payload


def _actions_map(row: dict[str, Any], field: str = "actions") -> dict[str, float]:
    result: dict[str, float] = {}
    for item in row.get(field) or []:
        action_type = item.get("action_type")
        value = item.get("value")
        if not action_type or value is None:
            continue
        try:
            result[action_type] = float(value)
        except (TypeError, ValueError):
            continue
    return result


def _normalize_insight_row(row: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(row)
    normalized["actions_by_type"] = _actions_map(row, "actions")
    normalized["cost_per_action_by_type"] = _actions_map(row, "cost_per_action_type")
    if row.get("website_purchase_roas"):
        normalized["website_purchase_roas_by_type"] = _actions_map(
            row, "website_purchase_roas"
        )
    return normalized


@mcp.tool()
async def meta_test_connection() -> dict[str, Any]:
    """Test the configured Meta access token and return the identity plus accessible ad accounts."""
    identity = await _graph_get("me", {"fields": "id,name"})
    accounts = await _graph_get(
        "me/adaccounts",
        {
            "fields": "id,account_id,name,account_status,currency,timezone_name,business_name",
            "limit": 100,
        },
    )
    return {"identity": identity, "ad_accounts": accounts.get("data", [])}


@mcp.tool()
async def meta_list_ad_accounts(limit: int = 100) -> dict[str, Any]:
    """List ad accounts available to the configured Meta token."""
    limit = max(1, min(limit, 200))
    payload = await _graph_get(
        "me/adaccounts",
        {
            "fields": "id,account_id,name,account_status,currency,timezone_name,business_name,amount_spent,balance",
            "limit": limit,
        },
    )
    return {"data": payload.get("data", []), "paging": payload.get("paging")}


@mcp.tool()
async def meta_list_campaigns(
    ad_account_id: str | None = None,
    limit: int = 100,
) -> dict[str, Any]:
    """List campaigns for a Meta ad account, including status, objective and budget fields."""
    account = _normalize_ad_account_id(ad_account_id)
    limit = max(1, min(limit, 200))
    payload = await _graph_get(
        f"{account}/campaigns",
        {
            "fields": "id,name,status,effective_status,objective,daily_budget,lifetime_budget,budget_remaining,buying_type,created_time,updated_time,start_time,stop_time",
            "limit": limit,
        },
    )
    return {"ad_account_id": account, "data": payload.get("data", []), "paging": payload.get("paging")}


@mcp.tool()
async def meta_list_adsets(
    ad_account_id: str | None = None,
    campaign_id: str | None = None,
    limit: int = 100,
) -> dict[str, Any]:
    """List ad sets for an ad account or one campaign."""
    parent = campaign_id.strip() if campaign_id else _normalize_ad_account_id(ad_account_id)
    limit = max(1, min(limit, 200))
    payload = await _graph_get(
        f"{parent}/adsets",
        {
            "fields": "id,name,campaign_id,status,effective_status,daily_budget,lifetime_budget,budget_remaining,billing_event,optimization_goal,bid_strategy,bid_amount,start_time,end_time,created_time,updated_time",
            "limit": limit,
        },
    )
    return {"parent_id": parent, "data": payload.get("data", []), "paging": payload.get("paging")}


@mcp.tool()
async def meta_list_ads(
    ad_account_id: str | None = None,
    adset_id: str | None = None,
    campaign_id: str | None = None,
    limit: int = 100,
) -> dict[str, Any]:
    """List ads for an ad account, campaign or ad set."""
    if adset_id:
        parent = adset_id.strip()
    elif campaign_id:
        parent = campaign_id.strip()
    else:
        parent = _normalize_ad_account_id(ad_account_id)
    limit = max(1, min(limit, 200))
    payload = await _graph_get(
        f"{parent}/ads",
        {
            "fields": "id,name,campaign_id,adset_id,status,effective_status,created_time,updated_time,creative{id,name,title,body,call_to_action_type,thumbnail_url,image_url,object_story_spec}",
            "limit": limit,
        },
    )
    return {"parent_id": parent, "data": payload.get("data", []), "paging": payload.get("paging")}


@mcp.tool()
async def meta_get_insights(
    ad_account_id: str | None = None,
    level: Literal["account", "campaign", "adset", "ad"] = "campaign",
    date_preset: str | None = "last_7d",
    since: str | None = None,
    until: str | None = None,
    limit: int = 100,
) -> dict[str, Any]:
    """Get Meta Ads performance metrics. Use either date_preset or since/until (YYYY-MM-DD)."""
    account = _normalize_ad_account_id(ad_account_id)
    if since or until:
        if not (since and until):
            raise ValueError("Provide both since and until when using a custom date range.")
        date_preset = None
        time_range = {"since": since, "until": until}
    else:
        time_range = None

    fields = ",".join(
        [
            "account_id",
            "account_name",
            "campaign_id",
            "campaign_name",
            "adset_id",
            "adset_name",
            "ad_id",
            "ad_name",
            "spend",
            "impressions",
            "reach",
            "frequency",
            "clicks",
            "inline_link_clicks",
            "ctr",
            "cpc",
            "cpm",
            "actions",
            "cost_per_action_type",
            "website_purchase_roas",
            "date_start",
            "date_stop",
        ]
    )
    params: dict[str, Any] = {
        "fields": fields,
        "level": level,
        "date_preset": date_preset,
        "limit": max(1, min(limit, 200)),
    }
    if time_range:
        import json

        params["time_range"] = json.dumps(time_range)

    payload = await _graph_get(f"{account}/insights", params)
    rows = [_normalize_insight_row(row) for row in payload.get("data", [])]
    return {
        "ad_account_id": account,
        "level": level,
        "date_preset": date_preset,
        "time_range": time_range,
        "data": rows,
        "paging": payload.get("paging"),
    }


@mcp.tool()
async def meta_get_object_insights(
    object_id: str,
    date_preset: str | None = "last_7d",
    since: str | None = None,
    until: str | None = None,
) -> dict[str, Any]:
    """Get aggregated insights for a specific campaign, ad set or ad by Meta object ID."""
    if since or until:
        if not (since and until):
            raise ValueError("Provide both since and until when using a custom date range.")
        date_preset = None
        time_range = {"since": since, "until": until}
    else:
        time_range = None

    fields = ",".join(
        [
            "spend",
            "impressions",
            "reach",
            "frequency",
            "clicks",
            "inline_link_clicks",
            "ctr",
            "cpc",
            "cpm",
            "actions",
            "cost_per_action_type",
            "website_purchase_roas",
            "date_start",
            "date_stop",
        ]
    )
    params: dict[str, Any] = {"fields": fields, "date_preset": date_preset}
    if time_range:
        import json

        params["time_range"] = json.dumps(time_range)
    payload = await _graph_get(f"{object_id.strip()}/insights", params)
    return {
        "object_id": object_id.strip(),
        "date_preset": date_preset,
        "time_range": time_range,
        "data": [_normalize_insight_row(row) for row in payload.get("data", [])],
    }


@mcp.custom_route("/health", methods=["GET"])
async def health(_: Request) -> Response:
    return JSONResponse(
        {
            "status": "ok",
            "service": SERVER_NAME,
            "meta_token_configured": bool(os.getenv("META_ACCESS_TOKEN", "").strip()),
            "default_ad_account_configured": bool(
                os.getenv("META_DEFAULT_AD_ACCOUNT_ID", "").strip()
            ),
        }
    )


transport_security = TransportSecuritySettings(enable_dns_rebinding_protection=False)
_mcp_app = mcp.streamable_http_app(
    transport_security=transport_security,
    stateless_http=True,
)


class QueryKeyAuthMiddleware:
    """Protect /mcp with a secret query key while keeping /health public."""

    def __init__(self, app: Any):
        self.app = app

    async def __call__(self, scope: dict[str, Any], receive: Any, send: Any) -> None:
        if scope.get("type") == "http" and scope.get("path", "").startswith("/mcp"):
            expected = os.getenv("MCP_ACCESS_KEY", "").strip()
            if expected:
                params = parse_qs(scope.get("query_string", b"").decode("utf-8"))
                provided = (params.get("key") or [""])[0]
                if provided != expected:
                    response = PlainTextResponse("Unauthorized", status_code=401)
                    await response(scope, receive, send)
                    return
        await self.app(scope, receive, send)


app = QueryKeyAuthMiddleware(_mcp_app)
