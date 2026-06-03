const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const normalizePem = (value: string | undefined) =>
  value?.replace(/\\n/g, '\n').trim() || ''

const pemToArrayBuffer = (pem: string) => {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '')

  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes.buffer
}

const signRequest = async (request: string, privateKeyPem: string) => {
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKeyPem),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-512',
    },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(request),
  )

  const bytes = new Uint8Array(signature)
  let binary = ''

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const certificate = normalizePem(Deno.env.get('QZ_CERTIFICATE'))
    const privateKey = normalizePem(Deno.env.get('QZ_PRIVATE_KEY'))

    if (req.method === 'GET' && url.pathname.endsWith('/certificate')) {
      if (!certificate) {
        return new Response('No se encontró el certificado de QZ Tray.', {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        })
      }

      return new Response(certificate, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      })
    }

    if (req.method === 'POST' && url.pathname.endsWith('/sign')) {
      if (!privateKey) {
        return json({
          ok: false,
          message: 'No se encontró QZ_PRIVATE_KEY.',
        }, 500)
      }

      const body = await req.json().catch(() => null)
      const requestToSign = typeof body?.request === 'string' ? body.request : ''

      if (!requestToSign) {
        return json({
          ok: false,
          message: 'Falta el texto a firmar.',
        }, 400)
      }

      const signature = await signRequest(requestToSign, privateKey)

      return json({
        ok: true,
        signature,
      })
    }

    return json({
      ok: false,
      message: 'Ruta QZ no encontrada.',
    }, 404)
  } catch (error) {
    return json({
      ok: false,
      message: error instanceof Error
        ? error.message
        : 'Error desconocido firmando solicitud QZ.',
    }, 500)
  }
})
