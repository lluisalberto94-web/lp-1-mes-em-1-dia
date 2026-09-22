# Freire Meta Ads MCP

Read-only MCP server for Meta Marketing API, designed for ChatGPT custom plugins.

## Environment variables

- `META_ACCESS_TOKEN` — Meta token with `ads_read` permission.
- `META_DEFAULT_AD_ACCOUNT_ID` — optional account ID, with or without `act_`.
- `META_API_VERSION` — optional Graph API version. If omitted, Meta uses the app's default Graph API version.
- `MCP_ACCESS_KEY` — secret query key required by `/mcp`.

## Endpoints

- `GET /health` — public liveness check; never returns secrets.
- `/mcp?key=...` — Streamable HTTP MCP endpoint.

## Included tools

- `meta_test_connection`
- `meta_list_ad_accounts`
- `meta_list_campaigns`
- `meta_list_adsets`
- `meta_list_ads`
- `meta_get_insights`
- `meta_get_object_insights`

This first version is intentionally read-only. Add write tools only after the connection and permissions are verified.
