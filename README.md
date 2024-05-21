# vidify Backend

vidify is an innovative project that utilizes OpenAI and Remotion to transform content in text format, into polished explainer videos. It uses Google's text-to-speech feature to provide the voice for the video.

This project is the Express backend. Also checkout the ([frontend](https://github.com/thecmdrunner/vidify-frontend)).

# Getting Started

To get started, follow these steps:

1. Clone the repository to your local machine.
2. Install dependencies using `npm install`.
3. Add a `.env` file to the root of the project and include the necessary environment variables.
4. Run the development server using `npm run start:dev`.
5. Congratulations! Your server is now running on http://localhost:5000.

## How it Works

vidify works by taking text input (prompt) from the user and utilizing OpenAI's APIs to generate talking points for the video. The script is then passed to Remotion, which generates the actual video with the help of Google's text-to-speech feature. The resulting video is then displayed to the user.

## Contributing

Contributions are welcome and encouraged. If you would like to contribute, please follow these steps:

- Fork the repository.
- Create a new branch for your changes.
- Make your changes and commit them with a descriptive message.
- Push your changes to your fork.
- Open a pull request to the main repository.

## License

The source code in this repository is licensed under the MIT license.
Remotion, a dependency of the frontend of this project, uses the Remotion license. Note that for some entities a company license is needed. [Read the terms here](https://remotion.dev/license).
