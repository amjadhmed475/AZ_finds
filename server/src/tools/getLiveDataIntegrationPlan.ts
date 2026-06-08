import { sourceStatuses } from "../services/apiUsageService.js";

const has = (name: string) => Boolean(process.env[name]);

export function getLiveDataIntegrationPlan(input: { marketplace?: string; include_csv_bridge?: boolean }) {
  const marketplace = input.marketplace ?? process.env.DEFAULT_MARKETPLACE ?? "US";
  const spApiReady = [
    "SP_API_CLIENT_ID",
    "SP_API_CLIENT_SECRET",
    "SP_API_REFRESH_TOKEN",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
  ].every(has);
  const adsReady = [
    "AMAZON_ADS_CLIENT_ID",
    "AMAZON_ADS_CLIENT_SECRET",
    "AMAZON_ADS_REFRESH_TOKEN",
    "AMAZON_ADS_PROFILE_ID",
  ].every(has);
  const creatorReady = has("AMAZON_CREATORS_API_KEY") || has("AMAZON_PA_API_KEY");

  return {
    marketplace,
    readiness: {
      sp_api: spApiReady ? "ready_to_wire_client" : "missing_credentials",
      amazon_ads_api: adsReady ? "ready_to_wire_client" : "missing_credentials_or_access_approval",
      creator_or_product_data: creatorReady ? "credential_present" : "missing_credentials",
      keepa: has("KEEPA_API_KEY") ? "credential_present" : "missing_credentials",
    },
    sources: sourceStatuses(),
    recommended_sequence: [
      "Start with Seller Central CSV import for immediate store-fit scoring while API approval is pending.",
      "Create a private SP-API application for your own seller account and self-authorize it in Seller Central.",
      "Use SP-API Reports first: open listings, inventory, and business reports give the dashboard high-value store context with low call volume.",
      "Add Catalog Items and Listings Items after report ingestion is stable.",
      "Apply for Amazon Ads API separately, then ingest search-term and targeting reports into optimize_ppc_from_report.",
      "Use Keepa or an approved product data API for candidate ASIN validation; do not scrape Seller Central or Amazon pages.",
    ],
    official_paths: [
      {
        name: "SP-API authorization",
        url: "https://developer-docs.amazon.com/sp-api/docs/authorizing-selling-partner-api-applications",
        note: "Private apps for a single organization use self-authorization.",
      },
      {
        name: "SP-API connection",
        url: "https://developer-docs.amazon.com/sp-api/lang-en_EN/docs/connecting-to-the-selling-partner-api",
        note: "Use Login with Amazon access tokens and signed SP-API requests.",
      },
      {
        name: "Inventory report",
        url: "https://developer-docs.amazon.com/sp-api/lang-en_EN/docs/report-type-values-inventory",
        note: "GET_FLAT_FILE_OPEN_LISTINGS_DATA summarizes listing price and quantity by SKU.",
      },
      {
        name: "Amazon Ads API",
        url: "https://advertising.amazon.com/about-api",
        note: "Requires Amazon Ads API access approval; useful for campaign reporting and optimization.",
      },
      {
        name: "PA-API migration",
        url: "https://webservices.amazon.com/paapi5/documentation/quick-start/operations-and-resources.html",
        note: "PA-API documentation says it was deprecated on May 15, 2026 and points to Creators API.",
      },
    ],
    env_required: {
      sp_api: [
        "SP_API_CLIENT_ID",
        "SP_API_CLIENT_SECRET",
        "SP_API_REFRESH_TOKEN",
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
        "AWS_REGION",
        "SP_API_ROLE_ARN",
        "SP_API_MARKETPLACE_ID",
      ],
      amazon_ads_api: [
        "AMAZON_ADS_CLIENT_ID",
        "AMAZON_ADS_CLIENT_SECRET",
        "AMAZON_ADS_REFRESH_TOKEN",
        "AMAZON_ADS_PROFILE_ID",
      ],
      product_data: ["AMAZON_CREATORS_API_KEY", "AMAZON_ASSOCIATE_TAG", "KEEPA_API_KEY"],
    },
    csv_bridge: input.include_csv_bridge === false ? undefined : {
      accepted_exports: [
        "Seller Central Business Reports CSV",
        "Open listings or inventory reports",
        "Amazon Ads search-term, targeting, campaign, or advertised-product CSV",
      ],
      dashboard_use: "The React Live Data tab parses CSV locally and scores product ideas against your real store before API credentials are connected.",
    },
    guardrails: [
      "Never paste API secrets into the browser dashboard.",
      "Store refresh tokens and AWS signing credentials only in server-side environment variables.",
      "Avoid restricted PII operations unless you implement Amazon's Restricted Data Token flow and compliance controls.",
      "Use official APIs, approved exports, or user-provided CSVs; do not bypass Amazon anti-bot or Seller Central protections.",
    ],
  };
}
