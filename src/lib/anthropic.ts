import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import dJSON from "dirty-json";
import { getPrompts } from "./upstash";
import { checkValidJson, extractJson } from "./openai_utils";
import type { FinalVideoDataFromServer, VideoMetadata } from "./interfaces";
import {
  ChatCompletionRequestMessage,
  CreateChatCompletionRequest,
} from "openai";
import { Message, MessageParam } from "@anthropic-ai/sdk/resources";
import {
  MessageCreateParamsBase,
  MessageCreateParamsNonStreaming,
} from "@anthropic-ai/sdk/resources/messages";

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // defaults to process.env["ANTHROPIC_API_KEY"]
});

export async function anthropicCheckModeration(input: string) {
  const policyString = `You will be acting as a content moderator to Flag user queries based on our content policy. Return a JSON with flagged property as true if it violates our content policy. Here is the content policy to follow:

<content_policy>
If the user's request refers to harmful, pornographic, or illegal activities, it violates the policy. If the user's request does not refer to harmful, pornographic, or illegal activities, it does not violated the policy. Reply with JSON object with nothing except the flagged property.
</content_policy>

And here is the chat transcript to review and classify:

<transcript>${input}
</transcript>`;

  try {
    const { content } = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 10,
      temperature: 0,
      messages: [{ role: "user", content: policyString }],
    });

    const data = await JSON.parse(content[0].text);

    console.log(
      `=====================\nPrompt is ${
        data.flagged ? "FLAGGED!" : "SAFE."
      }\n=====================`
    );

    return { isFlagged: data.flagged };
  } catch (error) {
    console.error("Moderation Error: ", error);
  }
}

export async function getAnthropicChatResponse(
  messages: ChatCompletionRequestMessage[],
  user?: CreateChatCompletionRequest["user"],
  options: Partial<CreateChatCompletionRequest> = {}
): Promise<string> {
  const anthropicMessages: MessageParam[] = [];
  messages.map((msg, index) => {
    const temp: MessageParam = {
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    };
    anthropicMessages.push(temp);
  });

  const anthropicOptions: Partial<MessageCreateParamsNonStreaming> = {
    max_tokens: options.max_tokens,
    model: options.model,
    temperature: options.temperature,
    top_p: options.top_p,
  };

  try {
    const { content: AIResponse } = await anthropic.messages.create({
      model: "claude-2.0",
      messages: anthropicMessages,
      max_tokens: 1024,
      stream: false,
      temperature: 0.8,
      // //   top_p: defaultOpenAIRequest.top_p, // disabled as per the docs recommendation.
      // //   frequency_penalty: defaultOpenAIRequest.frequency_penalty,
      // ...anthropicOptions,
    });

    const response = AIResponse[0].text as string;

    // console.log(`💬 Original AI response: `, response);

    return response;
  } catch (err: any) {
    console.error(err.response);

    throw `Error while fetching response: ${err}`;
  }
}
