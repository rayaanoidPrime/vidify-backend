import { VoiceGender } from "./interfaces";
import { md5 } from "./utils";
import textToSpeech from "@google-cloud/text-to-speech";
import {
  createFirebaseUrl,
  deleteFile,
  doesFileExist,
  uploadToFirebase,
} from "./firebase/utils";
import { uploadUncompressedAudio } from "./cloudinary/utils";
import { createClient } from "@deepgram/sdk";

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
// const client = new textToSpeech.TextToSpeechClient({
//   credentials: {
//     private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY,
//     client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
//     client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
//   },
// });

const voices = {
  male: ["aura-orion-en", "aura-perseus-en"],
  female: ["aura-asteria-en", "aura-luna-en", "aura-athena-en"],
} as const;

const preferredVoice = {
  male: voices.male[1],
  female: voices.female[0],
} as const;

export async function createTTSAudio({
  text,
  ssml,
  gender,
  fileDirectory,
}: {
  text: string;
  ssml?: string;
  gender: VoiceGender;
  fileDirectory: string;
}): Promise<CreatedTTSAudioData> {
  // console.log(`🟩 Trying to create TTS Audio for: ${text}`);

  /**
   * * Set the given input as directory name, instead of hash of the input (prompt in this case), to make refactoring easy in the Cloudinary and Firebase storage.
   */
  // const fileDirName = md5(fileDirectory);
  const fileDirName = fileDirectory;
  // const audioContentsHash = md5(ssml ? ssml : text);
  const audioContentsHash = md5(text);

  const filePath = `${fileDirName}/${preferredVoice[gender]}-${audioContentsHash}.mp3`;
  let firebaseURL = "";
  var fullPathOfUploadedFile = "";

  // Return URL if already exists
  const { exists, existingURL } = await isAudioAlreadySynthesized(filePath);
  if (exists) {
    firebaseURL = existingURL;
  } else {
    // Performs the text-to-speech request
    // console.log("🎤 Trying to create audio, with filePath: ", filePath);
    const response = await deepgram.speak.request(
      // Set Raw text or ideally SSML (recommended)
      {
        // ssml,
        text,
      },
      { model: preferredVoice[gender], encoding: "mp3" }
      // Set the language and voice.
      // voices: {
      //   name: preferredVoice[gender].name,
      //   languageCode: preferredVoice[gender].languageCode,
      // },
      // select the type of audio encoding

      // audioConfig: {
      //   // audioEncoding: "MP3",
      //   audioEncoding: "LINEAR16",
      //   effectsProfileId: ["large-home-entertainment-class-device"],
      //   pitch: preferredVoice[gender].pitch,
      //   speakingRate: preferredVoice[gender].speakingRate,
      // },
    );

    const stream = await response.getStream();
    const headers = await response.getHeaders();

    if (stream) {
      const buffer = await getAudioBuffer(stream);
      const fileUploaded = await uploadToFirebase(
        buffer as Uint8Array,
        filePath
      );
      fullPathOfUploadedFile = fileUploaded.metadata.fullPath; // for ex: tts-audio-files/31-DECEMBER-2022.mp3
    } else {
      console.error("Error generating audio:", stream);
    }
    // Upload the file to firebase

    // get full path in the bucket, store in the function scope by using `var`.
    // console.log("🏆 File uploaded at: ", fullPathOfUploadedFile);

    // fetch and return the URL
    firebaseURL = await createFirebaseUrl(fullPathOfUploadedFile);
  }

  // Create web-safe URL
  const filePublicID = filePath.replace(".mp3", "");
  // Upload to cloudinary
  const { duration, url } = await uploadUncompressedAudio({
    fileURL: firebaseURL,
    public_id: filePublicID,
  });

  /**
   * * DELETE the file from firebase storage.
   */

  if (fullPathOfUploadedFile.length > 2)
    await deleteFile(fullPathOfUploadedFile);

  return { duration, url };
}

const isAudioAlreadySynthesized = async (filePath: string) => {
  // console.log(`🟧 Checking if file exists: ${filePath}`);

  // TODO: REIMPLEMENT THIS FOR CLOUDINARY

  // return false; // JUST TESTING...

  return { exists: false, existingURL: "" };

  const result = await doesFileExist(filePath);
  return result;
}; // return url if present, or else false

// helper function to convert stream to audio buffer
const getAudioBuffer = async (response) => {
  const reader = response.getReader();
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
  }

  const dataArray = chunks.reduce(
    (acc, chunk) => Uint8Array.from([...acc, ...chunk]),
    new Uint8Array(0)
  );

  return Buffer.from(dataArray.buffer);
};
export interface CreatedTTSAudioData {
  url: string;
  duration: number;
}
