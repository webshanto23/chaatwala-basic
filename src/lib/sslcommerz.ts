import crypto from "crypto";

function getStoreId(): string {
  const id = process.env.SSLCOMMERZE_STORE_ID;
  if (!id) throw new Error("SSLCOMMERZE_STORE_ID is not configured");
  return id;
}

function getStorePassword(): string {
  const pw = process.env.SSLCOMMERZE_STORE_PASSWORD;
  if (!pw) throw new Error("SSLCOMMERZE_STORE_PASSWORD is not configured");
  return pw;
}

function getSessionApiUrl(): string {
  return (
    process.env.SSLCOMMERZE_STORE_SESSION_API ??
    "https://sandbox.sslcommerz.com/gwprocess/v4/api.php"
  );
}

function getValidationApiUrl(): string {
  return (
    process.env.SSLCOMMERZE_STORE_VALIDATION_API ??
    "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php"
  );
}

export function generateHash(payload: Record<string, string>, storePassword: string): string {
  const hashString = [
    payload.store_id ?? "",
    payload.total_amount ?? "",
    payload.currency ?? "",
    payload.tran_id ?? "",
    payload.success_url ?? "",
    payload.fail_url ?? "",
    payload.cancel_url ?? "",
    payload.ipn_url ?? "",
    payload.shipping_method ?? "",
    payload.product_name ?? "",
    payload.product_category ?? "",
    payload.product_profile ?? "",
    payload.name ?? "",
    payload.email ?? "",
    payload.address ?? "",
    payload.city ?? "",
    payload.state ?? "",
    payload.postcode ?? "",
    payload.country ?? "",
    payload.phone ?? "",
    payload.fax ?? "",
    payload.ship_name ?? "",
    payload.ship_add1 ?? "",
    payload.ship_city ?? "",
    payload.ship_state ?? "",
    payload.ship_postcode ?? "",
    payload.ship_country ?? "",
  ].join("|");

  return crypto.createHash("md5").update(hashString + storePassword).digest("hex").toLowerCase();
}

export interface InitiatePaymentRequest {
  tran_id: string;
  total_amount: number;
  currency: string;
  success_url: string;
  fail_url: string;
  cancel_url: string;
  ipn_url: string;
  shipping_method: string;
  product_name: string;
  product_category: string;
  product_profile: string;
  cus_name: string;
  cus_email: string;
  cus_phone: string;
  cus_add1: string;
  cus_city: string;
  cus_state: string;
  cus_postcode: string;
  cus_country: string;
  ship_name: string;
  ship_add1: string;
  ship_city: string;
  ship_state: string;
  ship_postcode: string;
  ship_country: string;
  value_a?: string;
  value_b?: string;
  value_c?: string;
  value_d?: string;
}

export interface InitiatePaymentResponse {
  GatewayPageURL: string;
  sessionkey: string;
  [key: string]: unknown;
}

export async function initiatePayment(
  payload: InitiatePaymentRequest
): Promise<InitiatePaymentResponse> {
  const storeId = getStoreId();
  const storePassword = getStorePassword();

  const formData = new URLSearchParams();
  formData.set("store_id", storeId);
  formData.set("store_passwd", storePassword);
  formData.set("total_amount", String(payload.total_amount));
  formData.set("currency", payload.currency);
  formData.set("tran_id", payload.tran_id);
  formData.set("success_url", payload.success_url);
  formData.set("fail_url", payload.fail_url);
  formData.set("cancel_url", payload.cancel_url);
  formData.set("ipn_url", payload.ipn_url);
  formData.set("shipping_method", payload.shipping_method);
  formData.set("product_name", payload.product_name);
  formData.set("product_category", payload.product_category);
  formData.set("product_profile", payload.product_profile);
  formData.set("cus_name", payload.cus_name);
  formData.set("cus_email", payload.cus_email);
  formData.set("cus_phone", payload.cus_phone);
  formData.set("cus_add1", payload.cus_add1);
  formData.set("cus_city", payload.cus_city);
  formData.set("cus_state", payload.cus_state);
  formData.set("cus_postcode", payload.cus_postcode);
  formData.set("cus_country", payload.cus_country);
  formData.set("ship_name", payload.ship_name);
  formData.set("ship_add1", payload.ship_add1);
  formData.set("ship_city", payload.ship_city);
  formData.set("ship_state", payload.ship_state);
  formData.set("ship_postcode", payload.ship_postcode);
  formData.set("ship_country", payload.ship_country);

  if (payload.value_a) formData.set("value_a", payload.value_a);
  if (payload.value_b) formData.set("value_b", payload.value_b);
  if (payload.value_c) formData.set("value_c", payload.value_c);
  if (payload.value_d) formData.set("value_d", payload.value_d);

  const hash = generateHash(
    {
      store_id: storeId,
      total_amount: String(payload.total_amount),
      currency: payload.currency,
      tran_id: payload.tran_id,
      success_url: payload.success_url,
      fail_url: payload.fail_url,
      cancel_url: payload.cancel_url,
      ipn_url: payload.ipn_url,
      shipping_method: payload.shipping_method,
      product_name: payload.product_name,
      product_category: payload.product_category,
      product_profile: payload.product_profile,
      name: payload.cus_name,
      email: payload.cus_email,
      address: payload.cus_add1,
      city: payload.cus_city,
      state: payload.cus_state,
      postcode: payload.cus_postcode,
      country: payload.cus_country,
      phone: payload.cus_phone,
      fax: "",
      ship_name: payload.ship_name,
      ship_add1: payload.ship_add1,
      ship_city: payload.ship_city,
      ship_state: payload.ship_state,
      ship_postcode: payload.ship_postcode,
      ship_country: payload.ship_country,
    },
    storePassword
  );

  formData.set("hash", hash);

  const apiUrl = getSessionApiUrl();

  const response = await fetch(apiUrl, {
    method: "POST",
    body: formData,
    headers: {
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`SSLCommerz initiation failed with status ${response.status}`);
  }

  const data = await response.json();

  if (!data.GatewayPageURL) {
    throw new Error(data.failedreason ?? "SSLCommerz did not return a GatewayPageURL");
  }

  return data;
}

export interface ValidationRequest {
  val_id: string;
  store_id: string;
  store_passwd: string;
  v: string;
}

export interface ValidationResponse {
  status: string;
  tran_id: string;
  val_id: string;
  amount: string;
  bank_tran_id: string;
  card_type: string;
  card_no: string;
  card_issuer: string;
  card_brand: string;
  card_issuer_country: string;
  card_issuer_country_code: string;
  currency: string;
  currency_amount: string;
  settled_amount: string;
  settled_date: string;
  txn_status: string;
  reason: string;
  gateway_page_url: string;
  [key: string]: unknown;
}

export async function validatePayment(
  valId: string
): Promise<ValidationResponse> {
  const storeId = getStoreId();
  const storePassword = getStorePassword();
  const apiUrl = getValidationApiUrl();

  const params = new URLSearchParams();
  params.set("val_id", valId);
  params.set("store_id", storeId);
  params.set("store_passwd", storePassword);
  params.set("v", "1");

  const response = await fetch(`${apiUrl}?${params.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`SSLCommerz validation failed with status ${response.status}`);
  }

  const data = await response.json();

  return data;
}
