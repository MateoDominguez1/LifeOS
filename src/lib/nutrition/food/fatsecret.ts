// FatSecret Platform API client. OAuth2 client-credentials (server-to-server,
// scope "basic"), REST endpoint at platform.fatsecret.com/rest/server.api.
// Note: FatSecret requires the calling IP to be allow-listed in the
// developer dashboard (unlike USDA/Gemini) — requests will fail with a
// clear "Invalid IP address" error until that's configured.
const TOKEN_URL = "https://oauth.fatsecret.com/connect/token";
const API_URL = "https://platform.fatsecret.com/rest/server.api";

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.accessToken;
  }

  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("FATSECRET_CLIENT_ID / FATSECRET_CLIENT_SECRET no están configuradas.");
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials&scope=basic",
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`FatSecret token respondió ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.accessToken;
}

const IP_ERROR_CODE = 21;

async function callApiOnce(params: Record<string, string>): Promise<unknown> {
  const token = await getAccessToken();
  const url = new URL(API_URL);
  url.searchParams.set("format", "json");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`FatSecret API respondió ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  if (data && typeof data === "object" && "error" in data) {
    const err = (data as { error: { code: number; message: string } }).error;
    const e = new Error(`FatSecret API error ${err.code}: ${err.message}`) as Error & { code?: number };
    e.code = err.code;
    throw e;
  }
  return data;
}

/** FatSecret's IP allow-list occasionally takes a moment to propagate across
 * their edge nodes — a request can 403/error on one node and succeed on the
 * very next call. Retry once on that specific error before giving up. */
async function callApi(params: Record<string, string>): Promise<unknown> {
  try {
    return await callApiOnce(params);
  } catch (error) {
    if (error instanceof Error && (error as Error & { code?: number }).code === IP_ERROR_CODE) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return callApiOnce(params);
    }
    throw error;
  }
}

export interface FatSecretFoodSummary {
  foodId: string;
  name: string;
  brandName: string | null;
  description: string;
}

export async function searchFatSecretFoods(query: string, maxResults = 15): Promise<FatSecretFoodSummary[]> {
  const data = (await callApi({ method: "foods.search", search_expression: query, max_results: String(maxResults) })) as {
    foods?: { food?: FatSecretRawFood | FatSecretRawFood[] };
  };

  const raw = data.foods?.food;
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];

  return list.map((f) => ({
    foodId: f.food_id,
    name: f.food_name,
    brandName: f.brand_name ?? null,
    description: f.food_description ?? "",
  }));
}

interface FatSecretRawFood {
  food_id: string;
  food_name: string;
  brand_name?: string;
  food_description?: string;
}

interface FatSecretServing {
  serving_id: string;
  serving_description: string;
  metric_serving_amount?: string;
  metric_serving_unit?: string;
  calories: string;
  protein: string;
  fat: string;
  carbohydrate: string;
  fiber?: string;
  sugar?: string;
  sodium?: string;
}

export interface MappedFatSecretFood {
  name: string;
  fatSecretId: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number | null;
  sugarPer100g: number | null;
  sodiumPer100g: number | null;
  commonPortionGrams: number | null;
}

export async function getFatSecretFoodDetails(foodId: string): Promise<MappedFatSecretFood | null> {
  const data = (await callApi({ method: "food.get.v4", food_id: foodId })) as {
    food?: { food_name: string; servings?: { serving?: FatSecretServing | FatSecretServing[] } };
  };
  const food = data.food;
  if (!food) return null;

  const rawServings = food.servings?.serving;
  const servings = Array.isArray(rawServings) ? rawServings : rawServings ? [rawServings] : [];
  if (servings.length === 0) return null;

  // Prefer a serving already expressed per 100g; otherwise scale the first
  // gram-based serving up/down to a 100g equivalent.
  const gramServing =
    servings.find((s) => s.metric_serving_unit === "g" && Number(s.metric_serving_amount) === 100) ??
    servings.find((s) => s.metric_serving_unit === "g");

  if (!gramServing || !gramServing.metric_serving_amount) return null;

  const factor = 100 / Number(gramServing.metric_serving_amount);

  return {
    name: food.food_name,
    fatSecretId: foodId,
    caloriesPer100g: Math.round(Number(gramServing.calories) * factor),
    proteinPer100g: Number((Number(gramServing.protein) * factor).toFixed(1)),
    carbsPer100g: Number((Number(gramServing.carbohydrate) * factor).toFixed(1)),
    fatPer100g: Number((Number(gramServing.fat) * factor).toFixed(1)),
    fiberPer100g: gramServing.fiber ? Number((Number(gramServing.fiber) * factor).toFixed(1)) : null,
    sugarPer100g: gramServing.sugar ? Number((Number(gramServing.sugar) * factor).toFixed(1)) : null,
    sodiumPer100g: gramServing.sodium ? Number((Number(gramServing.sodium) * factor).toFixed(1)) : null,
    commonPortionGrams: servings[0]?.metric_serving_unit === "g" ? Number(servings[0].metric_serving_amount) : null,
  };
}
