import { ChatCompletionRequestMessage } from "openai";
import { getAnthropicChatResponse } from "./anthropic";
import { VideoMetadata } from "./interfaces";
import { defaultMetadataOptions, getVideoMetadata } from "./openai";
import { extractJson, checkValidJson } from "./openai_utils";
import { getPrompts } from "./upstash";
let tryCount = 0;
async function testant() {
  const prompts = await getPrompts();

  const userPrompt =
    "I'm creating a video about woodworking. Please provide a suitable metadata for this short video strictly in JSON of type VideoMetadata = {   // Here, only assume common aspect ratios - 16:9, 18:9, 9:16 (for youtube shorts, tiktok, instagram reels)   width: number; // width in pixels   height: number; // height in pixels   color: {     accentColor: string; // hex code     gradientStartColor?: string; // hex code for the starting color of the gradient     gradientEndColor?: string; // hex code for the ending color of the gradient   };   topic: string; // topic of the video   description: string; // simple description to put below the youtube video, mentioning the contents of the video   title: string; // short incentivizing title for youtube video (somewhat clickbaity)   durationInSeconds: number; // desired duration of the video in seconds   style: fun | professional | normal; // professional is corporate sounding, fun is fancy and informal, normal is default.    // ! OMIT GRAPHIC FOR NOW...    graphic?: {     // Can there be a relevant graph or chart?     topic: string; // What should the graph/chart represent?     type:       | line-graph       | histogram       | curve-graph       | bar-graph       | pie-chart;   };   table?: {     // Can a relevant table be displayed?     label: string; // Short label of what the table represents   }; }";

  const messages: ChatCompletionRequestMessage[] = [
    { role: "user", content: userPrompt },
    // { role: "assistant", content: prompts.videoMetadata_system },
    ,
  ];
  try {
    tryCount = tryCount + 1;
    console.info(`Getting Metadata #${tryCount} TRY!`);

    // console.log(`🚨 CHECKING SYSTEM PROMPT: ${messages[0].content}`);
    // console.log(`🚨 CHECKING USER PROMPT: ${messages[1].content}`);

    const response = await getAnthropicChatResponse(messages);

    const extractedJson = extractJson(response);

    const isJSONValid = await checkValidJson(extractedJson);

    if (!isJSONValid) throw `Invalid JSON while generating METADATA...`;

    const data: VideoMetadata = await JSON.parse(extractedJson);

    // console.log(`🚨 VALIDATING METADATA: `, data);

    if (data.topic.length < 3 || data.description.length < 3)
      throw `Data seems to be invalid...`;

    console.log(`💜 Generated Metadata`, data);

    return {
      ...defaultMetadataOptions, // fill in any missing options.
      ...data,
    };
  } catch (err) {
    console.error(err);

    if (tryCount < 3) {
      console.info(`Error generating METADATA, trying again...`);
      return await testant();
    } else {
      console.error("RETRY LIMITS REACHED! Returning...");
      return null;
    }
  }
}

testant();
