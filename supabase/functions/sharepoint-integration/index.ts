
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
      case 'get-site-info':
        return await getSharePointSiteInfo(profile.microsoft_access_token)
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

async function getSharePointSiteInfo(accessToken: string) {
  try {
    // Get user's SharePoint sites
    const sitesResponse = await fetch('https://graph.microsoft.com/v1.0/sites?search=*', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!sitesResponse.ok) {
      throw new Error('Failed to get SharePoint sites')
    }

    const sites = await sitesResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        sites: sites.value
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw new Error(`Failed to get SharePoint site info: ${error.message}`)
  }
}

async function uploadToSharePoint(accessToken: string, { fileName, fileContent, folder, siteId, driveId }: any) {
  try {
    let targetSiteId = siteId
    let targetDriveId = driveId

    // If no specific site/drive provided, get the root site and default drive
    if (!targetSiteId || !targetDriveId) {
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
      targetSiteId = site.id

      // Get default drive
      const driveResponse = await fetch(`https://graph.microsoft.com/v1.0/sites/${targetSiteId}/drive`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!driveResponse.ok) {
        throw new Error('Failed to access SharePoint drive')
      }

      const drive = await driveResponse.json()
      targetDriveId = drive.id
    }

    // Create folder path - use the folder parameter or default to Documents
    const folderPath = folder && folder !== 'Documents' ? `/${folder}` : ''
    
    // Upload file
    const uploadResponse = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${targetDriveId}/root:${folderPath}/${fileName}:/content`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream'
        },
        body: new Uint8Array(fileContent)
      }
    )

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('Upload error response:', errorText)
      throw new Error(`Failed to upload file to SharePoint: ${uploadResponse.status} ${errorText}`)
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
          driveId: targetDriveId,
          itemId: uploadResult.id,
          etag: uploadResult.eTag,
          siteId: targetSiteId
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}

async function downloadFromSharePoint(accessToken: string, { driveId, itemId }: any) {
  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/content`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to download file from SharePoint: ${response.status}`)
    }

    const fileContent = await response.arrayBuffer()

    return new Response(fileContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment'
      }
    })
  } catch (error) {
    console.error('Download error:', error)
    throw error
  }
}

async function deleteFromSharePoint(accessToken: string, { driveId, itemId }: any) {
  try {
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
      throw new Error(`Failed to delete file from SharePoint: ${response.status}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Delete error:', error)
    throw error
  }
}

async function listSharePointFiles(accessToken: string, { folder, siteId, driveId }: any) {
  try {
    let targetSiteId = siteId
    let targetDriveId = driveId

    // If no specific site/drive provided, get the root site and default drive
    if (!targetSiteId || !targetDriveId) {
      const sitesResponse = await fetch('https://graph.microsoft.com/v1.0/sites/root', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!sitesResponse.ok) {
        throw new Error('Failed to access SharePoint site')
      }

      const site = await sitesResponse.json()
      targetSiteId = site.id

      // Get default drive
      const driveResponse = await fetch(`https://graph.microsoft.com/v1.0/sites/${targetSiteId}/drive`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!driveResponse.ok) {
        throw new Error('Failed to access SharePoint drive')
      }

      const drive = await driveResponse.json()
      targetDriveId = drive.id
    }

    // List files in folder
    const folderPath = folder && folder !== 'Documents' ? `/${folder}` : ''
    let filesEndpoint = `https://graph.microsoft.com/v1.0/drives/${targetDriveId}/root/children`
    
    if (folderPath) {
      filesEndpoint = `https://graph.microsoft.com/v1.0/drives/${targetDriveId}/root:${folderPath}:/children`
    }

    const filesResponse = await fetch(filesEndpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!filesResponse.ok) {
      // If folder doesn't exist, return empty list instead of error
      if (filesResponse.status === 404) {
        return new Response(
          JSON.stringify({
            success: true,
            files: [],
            siteId: targetSiteId,
            driveId: targetDriveId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw new Error(`Failed to list SharePoint files: ${filesResponse.status}`)
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
          driveId: targetDriveId,
          itemId: file.id,
          etag: file.eTag,
          lastModified: file.lastModifiedDateTime,
          siteId: targetSiteId
        })),
        siteId: targetSiteId,
        driveId: targetDriveId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('List files error:', error)
    throw error
  }
}
