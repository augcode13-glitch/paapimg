import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const PEXELS_API_KEY = Deno.env.get("PEXELS_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  avg_color: string;
  alt: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
  };
}

interface PexelsResponse {
  photos: PexelsPhoto[];
  page: number;
  per_page: number;
  total_results: number;
  next_page?: string;
}

async function cachePexelsImages() {
  if (!PEXELS_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing environment variables");
  }

  const supabase = await import("npm:@supabase/supabase-js@2.57.4").then(
    (module) => module.createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  );

  let allPhotos: PexelsPhoto[] = [];
  let page = 1;
  const photosPerPage = 80;
  const totalPhotosToCache = 1000;
  const maxPages = Math.ceil(totalPhotosToCache / photosPerPage);

  console.log(`Starting to cache ${totalPhotosToCache} images...`);

  for (let i = 0; i < maxPages; i++) {
    try {
      const response = await fetch(
        `https://api.pexels.com/v1/curated?page=${page}&per_page=${photosPerPage}`,
        {
          headers: {
            Authorization: PEXELS_API_KEY,
          },
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch page ${page}: ${response.statusText}`);
        break;
      }

      const data = (await response.json()) as PexelsResponse;
      allPhotos = [...allPhotos, ...data.photos];

      console.log(`Fetched ${allPhotos.length} photos so far...`);

      if (allPhotos.length >= totalPhotosToCache) {
        allPhotos = allPhotos.slice(0, totalPhotosToCache);
        break;
      }

      page++;
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
      break;
    }
  }

  console.log(`Total photos fetched: ${allPhotos.length}`);

  const imagesToInsert = allPhotos.map((photo) => ({
    pexels_id: photo.id.toString(),
    url: photo.url,
    photographer: photo.photographer,
    photographer_url: photo.photographer_url,
    avg_color: photo.avg_color,
    width: photo.width,
    height: photo.height,
    src_original: photo.src.original,
    src_large2x: photo.src.large2x,
    src_large: photo.src.large,
    src_medium: photo.src.medium,
    src_small: photo.src.small,
    alt: photo.alt || "",
  }));

  const { error } = await supabase
    .from("image_cache")
    .upsert(imagesToInsert, { onConflict: "pexels_id" });

  if (error) {
    console.error("Error inserting images:", error);
    throw error;
  }

  console.log(`Successfully cached ${imagesToInsert.length} images`);

  return {
    success: true,
    message: `Cached ${imagesToInsert.length} images`,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const result = await cachePexelsImages();

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});