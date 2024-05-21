import dotenv from "dotenv";
import { getJson } from "serpapi";
import {
  CustomImageDataFromBing,
  CustomImageDataFromGoogleSerpapi,
} from "~/lib/interfaces";

dotenv.config();
const serpapiKey = process.env.SERPAPI_KEY as string;

export async function getGoogleImages(data: {
  query: string;
  count?: number;
}): Promise<CustomImageDataFromBing[]> {
  const response = await getJson({
    q: data.query,
    engine: "google_images",
    api_key: serpapiKey,
  });

  const imageResults: CustomImageDataFromGoogleSerpapi[] =
    response.images_results.slice(0, data.count);

  const imageResultsBingType: CustomImageDataFromBing[] = [];
  imageResults.forEach((image, index) => {
    const customImage: CustomImageDataFromBing = {
      name: image.title,
      contentUrl: image.original,
      hostPageUrl: image.link,
      hostPageDisplayUrl: image.source,
      encodingFormat: "image/jpeg", // Example encoding format (replace with actual)
      contentSize: "unknown", // Example content size (replace with actual)
      width: image.original_width,
      height: image.original_height,
      accentColor: "#FFFFFF", // Example accent color (replace with actual)
      imageId: image.related_content_id,
    };

    imageResultsBingType.push(customImage);
  });

  return imageResultsBingType;
}
