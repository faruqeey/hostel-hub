const PAYSTACK_BASE_URL = 'https://api.paystack.co'

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY
  if (!key) throw new Error('Missing PAYSTACK_SECRET_KEY env var')
  return key
}

export interface InitializeTransactionParams {
  email: string
  amountKobo: number // Paystack expects the amount in the lowest currency unit (kobo for NGN)
  reference: string
  callbackUrl: string
  metadata?: Record<string, unknown>
}

export interface InitializeTransactionResponse {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export async function initializeTransaction(
  params: InitializeTransactionParams): Promise<InitializeTransactionResponse> {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      callback_url: params.callbackUrl,
      currency: 'NGN',
      metadata: params.metadata,
    }),
  })

  const json = (await res.json()) as InitializeTransactionResponse

  if (!res.ok || !json.status) {
    throw new Error(json.message || 'Failed to initialize Paystack transaction')
  }

  return json
}

export interface VerifyTransactionResponse {
  status: boolean
  message: string
  data: {
    status: 'success' | 'failed' | 'abandoned'
    reference: string
    amount: number
    currency: string
    channel: string
    paid_at: string | null
    customer: { email: string }
    metadata: Record<string, unknown>
  }
}

export async function verifyTransaction(
  reference: string
): Promise<VerifyTransactionResponse> {
  const res = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${getSecretKey()}` },
    }
  )

  const json = (await res.json()) as VerifyTransactionResponse

  if (!res.ok || !json.status) {
    throw new Error(json.message || 'Failed to verify Paystack transaction')
  }

  return json
}