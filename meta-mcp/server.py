import html
import os
import secrets
import time
from typing import Any, Literal

import httpx
from mcp.server import MCPServer
from mcp.server.auth.provider import (
    AccessToken,
    AuthorizationCode,
    AuthorizationParams,
    OAuthAuthorizationServerProvider,
    RefreshToken,
    construct_redirect_uri,
)
from mcp.server.auth.settings import AuthSettings, ClientRegistrationOptions
from mcp.server.transport_security import TransportSecuritySettings
from mcp.shared.auth import OAuthClientInformationFull, OAuthToken
from pydantic import AnyHttpUrl
from starlette.exceptions import HTTPException
from starlette.requests import Request
from starlette.responses import HTMLResponse, JSONResponse, RedirectResponse, Response

SERVER_NAME = "Freire Meta Ads MCP"
GRAPH_ROOT = "https://graph.facebook.com"
DEFAULT_TIMEOUT = 30.0
PUBLIC_BASE_URL = os.getenv(
    "PUBLIC_BASE_URL",
    "https://meta-ads-mcp-production-f2a6.up.railway.app",
).strip().rstrip("/")
RESOURCE_URL = f"{PUBLIC_BASE_URL}/mcp"
OAUTH_SCOPE = "meta.read"
OFFLINE_SCOPE = "offline_access"


class SingleUserOAuthProvider(
    OAuthAuthorizationServerProvider[AuthorizationCode, RefreshToken, AccessToken]
):
    """Small single-user OAuth provider for this private MCP service."""

    def __init__(self) -> None:
        self.clients: dict[str, OAuthClientInformationFull] = {}
        self.auth_codes: dict[str, AuthorizationCode] = {}
        self.access_tokens: dict[str, AccessToken] = {}
        self.refresh_tokens: dict[str, RefreshToken] = {}
        self.state_mapping: dict[str, dict[str, Any]] = {}

    async def get_client(self, client_id: str) -> OAuthClientInformationFull | None:
        return self.clients.get(client_id)

    async def register_client(self, client_info: OAuthClientInformationFull) -> None:
        if not client_info.client_id:
            raise ValueError("OAuth client is missing client_id")
        self.clients[client_info.client_id] = client_info

    async def authorize(
        self,
        client: OAuthClientInformationFull,
        params: AuthorizationParams,
    ) -> str:
        if not client.client_id:
            raise ValueError("OAuth client is missing client_id")

        state = params.state or secrets.token_urlsafe(24)
        scopes = list(params.scopes or [OAUTH_SCOPE])
        if OAUTH_SCOPE not in scopes:
            scopes.append(OAUTH_SCOPE)

        self.state_mapping[state] = {
            "redirect_uri": str(params.redirect_uri),
            "redirect_uri_provided_explicitly": bool(
                params.redirect_uri_provided_explicitly
            ),
            "code_challenge": params.code_challenge,
            "client_id": client.client_id,
            "resource": params.resource or RESOURCE_URL,
            "scopes": scopes,
        }
        return f"{PUBLIC_BASE_URL}/login?state={state}"

    async def load_authorization_code(
        self,
        client: OAuthClientInformationFull,
        authorization_code: str,
    ) -> AuthorizationCode | None:
        code = self.auth_codes.get(authorization_code)
        if not code or code.client_id != client.client_id:
            return None
        return code

    async def exchange_authorization_code(
        self,
        client: OAuthClientInformationFull,
        authorization_code: AuthorizationCode,
    ) -> OAuthToken:
        stored = self.auth_codes.pop(authorization_code.code, None)
        if not stored or not client.client_id:
            raise ValueError("Invalid authorization code")

        access_value = f"mcp_at_{secrets.token_urlsafe(32)}"
        refresh_value = f"mcp_rt_{secrets.token_urlsafe(40)}"
        access_exp = int(time.time()) + 3600
        refresh_exp = int(time.time()) + (60 * 60 * 24 * 30)

        self.access_tokens[access_value] = AccessToken(
            token=access_value,
            client_id=client.client_id,
            scopes=authorization_code.scopes,
            expires_at=access_exp,
            resource=authorization_code.resource or RESOURCE_URL,
            subject="luis",
        )
        self.refresh_tokens[refresh_value] = RefreshToken(
            token=refresh_value,
            client_id=client.client_id,
            scopes=authorization_code.scopes,
            expires_at=refresh_exp,
            resource=authorization_code.resource or RESOURCE_URL,
            subject="luis",
        )

        return OAuthToken(
            access_token=access_value,
            token_type="Bearer",
            expires_in=3600,
            scope=" ".join(authorization_code.scopes),
            refresh_token=refresh_value,
        )

    async def load_access_token(self, token: str) -> AccessToken | None:
        access = self.access_tokens.get(token)
        if not access:
            return None
        if access.expires_at and access.expires_at < time.time():
            self.access_tokens.pop(token, None)
            return None
        return access

    async def load_refresh_token(
        self,
        client: OAuthClientInformationFull,
        refresh_token: str,
    ) -> RefreshToken | None:
        token = self.refresh_tokens.get(refresh_token)
        if not token or token.client_id != client.client_id:
            return None
        if token.expires_at and token.expires_at < time.time():
            self.refresh_tokens.pop(refresh_token, None)
            return None
        return token

    async def exchange_refresh_token(
        self,
        client: OAuthClientInformationFull,
        refresh_token: RefreshToken,
        scopes: list[str],
    ) -> OAuthToken:
        if not client.client_id:
            raise ValueError("OAuth client is missing client_id")

        self.refresh_tokens.pop(refresh_token.token, None)

        access_value = f"mcp_at_{secrets.token_urlsafe(32)}"
        refresh_value = f"mcp_rt_{secrets.token_urlsafe(40)}"
        access_exp = int(time.time()) + 3600
        refresh_exp = int(time.time()) + (60 * 60 * 24 * 30)

        self.access_tokens[access_value] = AccessToken(
            token=access_value,
            client_id=client.client_id,
            scopes=scopes,
            expires_at=access_exp,
            resource=refresh_token.resource or RESOURCE_URL,
            subject=refresh_token.subject or "luis",
        )
        self.refresh_tokens[refresh_value] = RefreshToken(
            token=refresh_value,
            client_id=client.client_id,
            scopes=scopes,
            expires_at=refresh_exp,
            resource=refresh_token.resource or RESOURCE_URL,
            subject=refresh_token.subject or "luis",
        )

        return OAuthToken(
            access_token=access_value,
            token_type="Bearer",
            expires_in=3600,
            scope=" ".join(scopes),
            refresh_token=refresh_value,
        )

    async def revoke_token(self, token: AccessToken | RefreshToken) -> None:
        self.access_tokens.pop(token.token, None)
        self.refresh_tokens.pop(token.token, None)


oauth_provider = SingleUserOAuthProvider()

mcp = MCPServer(
    SERVER_NAME,
    auth_server_provider=oauth_provider,
    auth=AuthSettings(
        issuer_url=AnyHttpUrl(PUBLIC_BASE_URL),
        resource_server_url=AnyHttpUrl(RESOURCE_URL),
        required_scopes=[OAUTH_SCOPE],
        validate_token_resource=True,
        client_registration_options=ClientRegistrationOptions(
            enabled=True,
            valid_scopes=[OAUTH_SCOPE, OFFLINE_SCOPE],
            default_scopes=[OAUTH_SCOPE, OFFLINE_SCOPE],
        ),
    ),
)


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
        response = await client.get(
            url,
            params=_clean_params(params or {}),
            headers=headers,
        )
    try:
        payload = response.json()
    except ValueError:
        payload = {
            "error": {"message": response.text or "Non-JSON response from Meta"}
        }
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
    normalized["cost_per_action_by_type"] = _actions_map(
        row,
        "cost_per_action_type",
    )
    if row.get("website_purchase_roas"):
        normalized["website_purchase_roas_by_type"] = _actions_map(
            row,
            "website_purchase_roas",
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
    return {
        "ad_account_id": account,
        "data": payload.get("data", []),
        "paging": payload.get("paging"),
    }


@mcp.tool()
async def meta_list_adsets(
    ad_account_id: str | None = None,
    campaign_id: str | None = None,
    limit: int = 100,
) -> dict[str, Any]:
    """List ad sets for an ad account or one campaign."""
    parent = (
        campaign_id.strip()
        if campaign_id
        else _normalize_ad_account_id(ad_account_id)
    )
    limit = max(1, min(limit, 200))
    payload = await _graph_get(
        f"{parent}/adsets",
        {
            "fields": "id,name,campaign_id,status,effective_status,daily_budget,lifetime_budget,budget_remaining,billing_event,optimization_goal,bid_strategy,bid_amount,start_time,end_time,created_time,updated_time",
            "limit": limit,
        },
    )
    return {
        "parent_id": parent,
        "data": payload.get("data", []),
        "paging": payload.get("paging"),
    }


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
    return {
        "parent_id": parent,
        "data": payload.get("data", []),
        "paging": payload.get("paging"),
    }


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
            raise ValueError(
                "Provide both since and until when using a custom date range."
            )
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
            raise ValueError(
                "Provide both since and until when using a custom date range."
            )
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
        "data": [
            _normalize_insight_row(row)
            for row in payload.get("data", [])
        ],
    }


@mcp.custom_route("/login", methods=["GET"])
async def login_page(request: Request) -> Response:
    state = request.query_params.get("state", "")
    if not state or state not in oauth_provider.state_mapping:
        raise HTTPException(400, "Invalid or missing OAuth state")

    safe_state = html.escape(state, quote=True)
    username = html.escape(
        os.getenv("OAUTH_USERNAME", "luis").strip() or "luis",
        quote=True,
    )
    action = html.escape(
        f"{PUBLIC_BASE_URL}/login/callback",
        quote=True,
    )
    return HTMLResponse(
        f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Conectar Meta Ads MCP</title>
<style>
body{{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:32px}}
.card{{max-width:420px;margin:40px auto;background:#fff;padding:28px;border-radius:14px;box-shadow:0 8px 28px rgba(0,0,0,.08)}}
h1{{font-size:22px;margin:0 0 8px}}
p{{color:#555;line-height:1.45}}
label{{display:block;margin:16px 0 6px;font-weight:600}}
input{{box-sizing:border-box;width:100%;padding:11px 12px;border:1px solid #ccc;border-radius:8px;font-size:16px}}
button{{width:100%;margin-top:20px;padding:12px;border:0;border-radius:8px;background:#171717;color:#fff;font-size:16px;font-weight:700;cursor:pointer}}
.small{{font-size:12px;color:#777;margin-top:16px}}
</style>
</head>
<body>
<div class="card">
<h1>Autorizar Meta Ads MCP</h1>
<p>Entre com a credencial privada deste servidor para permitir que o ChatGPT consulte as campanhas.</p>
<form method="post" action="{action}">
<input type="hidden" name="state" value="{safe_state}">
<label>Usuário</label>
<input name="username" value="{username}" autocomplete="username" required>
<label>Senha</label>
<input name="password" type="password" autocomplete="current-password" required autofocus>
<button type="submit">Autorizar conexão</button>
</form>
<p class="small">A senha deste formulário não é o token da Meta.</p>
</div>
</body>
</html>"""
    )


@mcp.custom_route("/login/callback", methods=["POST"])
async def login_callback(request: Request) -> Response:
    form = await request.form()
    username = form.get("username")
    password = form.get("password")
    state = form.get("state")

    if not all(isinstance(v, str) and v for v in (username, password, state)):
        raise HTTPException(400, "Missing login fields")

    expected_user = os.getenv("OAUTH_USERNAME", "luis").strip() or "luis"
    expected_password = os.getenv("OAUTH_PASSWORD", "").strip()

    if not expected_password:
        raise HTTPException(503, "OAUTH_PASSWORD is not configured")

    if not secrets.compare_digest(username, expected_user) or not secrets.compare_digest(
        password,
        expected_password,
    ):
        return HTMLResponse(
            "<h2>Credenciais inválidas.</h2><p>Volte e tente novamente.</p>",
            status_code=401,
        )

    state_data = oauth_provider.state_mapping.pop(state, None)
    if not state_data:
        raise HTTPException(400, "OAuth state expired or invalid")

    code_challenge = state_data["code_challenge"]
    if not code_challenge:
        raise HTTPException(400, "PKCE code challenge is required")

    new_code = f"mcp_code_{secrets.token_urlsafe(24)}"
    oauth_provider.auth_codes[new_code] = AuthorizationCode(
        code=new_code,
        client_id=state_data["client_id"],
        redirect_uri=AnyHttpUrl(state_data["redirect_uri"]),
        redirect_uri_provided_explicitly=state_data[
            "redirect_uri_provided_explicitly"
        ],
        expires_at=time.time() + 300,
        scopes=state_data["scopes"],
        code_challenge=code_challenge,
        resource=state_data["resource"],
        subject="luis",
    )

    return RedirectResponse(
        url=construct_redirect_uri(
            state_data["redirect_uri"],
            code=new_code,
            state=state,
        ),
        status_code=302,
    )


@mcp.custom_route("/health", methods=["GET"])
async def health(_: Request) -> Response:
    return JSONResponse(
        {
            "status": "ok",
            "service": SERVER_NAME,
            "oauth": True,
            "meta_token_configured": bool(
                os.getenv("META_ACCESS_TOKEN", "").strip()
            ),
            "default_ad_account_configured": bool(
                os.getenv("META_DEFAULT_AD_ACCOUNT_ID", "").strip()
            ),
        }
    )


transport_security = TransportSecuritySettings(
    enable_dns_rebinding_protection=False
)
app = mcp.streamable_http_app(
    transport_security=transport_security,
    stateless_http=True,
)
