
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Get user's Microsoft access token
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('microsoft_access_token')
      .eq('id', user.id)
      .single()

    if (!profile?.microsoft_access_token) {
      throw new Error('Microsoft account not connected')
    }

    const { action, ...body } = await req.json()

    switch (action) {
      case 'upload':
        return await uploadToSharePoint(profile.microsoft_access_token, body)
      case 'download':
        return await downloadFromSharePoint(profile.microsoft_access_token, body)
      case 'delete':
        return await deleteFromSharePoint(profile.microsoft_access_token, body)
      case 'list':
        return await listSharePointFiles(profile.microsoft_access_token, body)
      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('SharePoint integration error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function uploadToSharePoint(accessToken: string, { fileName, fileContent, folder }: any) {
  // Get SharePoint site and drive
  const sitesResponse = await fetch('https://graph.microsoft.com/v1.0/sites/root', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  if (!sitesResponse.ok) {
    throw new Error('Failed to access SharePoint site')
  }

  const site = await sitesResponse.json()

  // Get default drive
  const driveResponse = await fetch(`https://graph.microsoft.com/v1.0/sites/${site.id}/drive`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!driveResponse.ok) {
    throw new Error('Failed to access SharePoint drive')
  }

  const drive = await driveResponse.json()

  // Create folder path
  const folderPath = folder ? `/${folder}` : '/Documents'
  
  // Upload file
  const uploadResponse = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${drive.id}/root:${folderPath}/${fileName}:/content`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream'
      },
      body: fileContent
    }
  )

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload file to SharePoint')
  }

  const uploadResult = await uploadResponse.json()

  return new Response(
    JSON.stringify({
      success: true,
      file: {
        id: uploadResult.id,
        name: uploadResult.name,
        webUrl: uploadResult.webUrl,
        downloadUrl: uploadResult['@microsoft.graph.downloadUrl'],
        size: uploadResult.size,
        driveId: drive.id,
        itemId: uploadResult.id,
        etag: uploadResult.eTag
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function downloadFromSharePoint(accessToken: string, { driveId, itemId }: any) {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/content`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )

  if (!response.ok) {
    throw new Error('Failed to download file from SharePoint')
  }

  const fileContent = await response.arrayBuffer()

  return new Response(fileContent, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment'
    }
  })
}

async function deleteFromSharePoint(accessToken: string, { driveId, itemId }: any) {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )

  if (!response.ok) {
    throw new Error('Failed to delete file from SharePoint')
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function listSharePointFiles(accessToken: string, { folder }: any) {
  // Get SharePoint site and drive
  const sitesResponse = await fetch('https://graph.microsoft.com/v1.0/sites/root', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!sitesResponse.ok) {
    throw new Error('Failed to access SharePoint site')
  }

  const site = await sitesResponse.json()

  // Get default drive
  const driveResponse = await fetch(`https://graph.microsoft.com/v1.0/sites/${site.id}/drive`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!driveResponse.ok) {
    throw new Error('Failed to access SharePoint drive')
  }

  const drive = await driveResponse.json()

  // List files in folder
  const folderPath = folder ? `/${folder}` : '/Documents'
  const filesResponse = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${drive.id}/root:${folderPath}:/children`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )

  if (!filesResponse.ok) {
    throw new Error('Failed to list SharePoint files')
  }

  const files = await filesResponse.json()

  return new Response(
    JSON.stringify({
      success: true,
      files: files.value.map((file: any) => ({
        id: file.id,
        name: file.name,
        webUrl: file.webUrl,
        downloadUrl: file['@microsoft.graph.downloadUrl'],
        size: file.size,
        driveId: drive.id,
        itemId: file.id,
        etag: file.eTag,
        lastModified: file.lastModifiedDateTime
      }))
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
