# AI Image Effect Generator Backend

This is the backend server for an application that allows users to register, log in, upload images, and apply (simulated) AI-powered effects using a Hugging Face model. The application also features a credit system to manage image generation usage.

## Features

- User registration (email/password) and login.
- JWT-based authentication.
- Google OAuth 2.0 for login (requires user configuration).
- Image upload and processing (currently simulated).
- Credit system for users to generate images.
- Database storage for user accounts and generated image metadata.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14.x or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js) or [yarn](https://yarnpkg.com/)
- [MySQL](https://www.MySQL.org/) database server

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm i` `nstall
    # or
    # yarn i` `nstall
    ```

3.  **Set up MySQL Database:**
    - Ensure you have a MySQL server running.
    - Create a database for this application (e.g., `ai_image_app_db`). Note: MySQL typically uses backticks for identifiers if needed, but database names usually do not require them if they are simple.
    - The application will attempt to create the necessary tables (`users`, `generated_images`) on startup if they don't exist.

4.  **Configure Environment Variables:**
    - Copy the example environment file to a new `.env` file:
      ```bash
      cp .env.example .env
      ```
    - Open the `.env` file and update the variables with your specific settings. Below is a description of each variable:

| Variable                  | Description                                                                 | Example Value                                       |
|---------------------------|-----------------------------------------------------------------------------|-----------------------------------------------------|
| `DB_HOST`                 | Hostname of your MySQL server.                                              | `localhost`                                         |
| `DB_USER`                 | MySQL username.                                                             | `your_mysql_user`                                   |
| `DB_PASSWORD`             | MySQL password.                                                             | `your_mysql_password`                               |
| `DB_NAME`                 | Name of the database to use.                                                | `ai_image_app_db`                                   |
| `DB_PORT`                 | Port number for MySQL.                                                      | `3306`                                              |
| `PORT`                    | Port on which the application server will run.                              | `5000`                                              |
| `HF_API_KEY`              | Your API key for Hugging Face. **(Currently simulated)**                    | `your_hugging_face_api_key_here`                    |
| `DEFAULT_HF_MODEL_ID`     | Identifier for the Hugging Face model being used. **(Currently simulated)** | `simulated_model_v1`                                |
| `JWT_SECRET`              | A strong, unique secret key for signing JWTs. **Change this!**              | `your_very_secure_jwt_secret_please_change`         |
| `JWT_EXPIRES_IN`          | Expiration time for JWTs (e.g., 7d, 24h, 60m).                              | `7d`                                                |
| `INFO_VARIABLE_CREDITO_COSTE` | Cost in credits for one image generation.                               | `50`                                                |
| `DEFAULT_USER_CREDITS`    | Number of credits new users receive upon registration.                      | `100`                                               |
| `GOOGLE_CLIENT_ID`        | Your Google OAuth Client ID. Required for Google login.                     | `your_google_client_id_from_google_cloud_console`   |
| `GOOGLE_CLIENT_SECRET`    | Your Google OAuth Client Secret. Required for Google login.                 | `your_google_client_secret_from_google_cloud_console` |
| `NODE_ENV`                | Application environment.                                                    | `development` or `production`                       |
    - **Important for Google OAuth:** To use Google login, you must set up a project in the [Google Cloud Console](https://console.cloud.google.com/), enable the Google People API (or similar, depending on scopes), and obtain OAuth 2.0 Client ID and Client Secret. Ensure the "Authorized redirect URIs" in your Google Cloud OAuth settings include `http://localhost:PORT/api/auth/google/callback` (replace `PORT` with your actual port).

    - **Hugging Face API Note:** The current implementation simulates the Hugging Face API call. To connect to a real Hugging Face model, you will need to update the `hgController.js` file with actual API request logic using your `HF_API_KEY` and a valid model endpoint.

## Running the Application

### Backend

1.  **Start the server:**
    ```bash
    npm s` `tart
    ```
    (This assumes a `start` script in `package.json` like `"start": "node app.js"`)

2.  The backend should now be running on the configured port (default: `http://127.0.0.1:5000` or `http://localhost:5000`).

### Frontend (React Native)

**General Setup:**

Ensure you have a React Native development environment set up. Follow the official React Native documentation for [setting up the development environment](https://reactnative.dev/docs/environment-setup) (choose "React Native CLI Quickstart").

**Running on Android:**

```bash
npx react-native run-android
```

**Running on iOS (macOS only):**

```bash
npx react-native run-ios
```

**Running on Web (Experimental/Community Support):**

To run a React Native app on the web, you typically need to use a library like `react-native-web`. The setup can vary depending on the project's configuration. If the project is already configured for web:

```bash
npm run web
# or yarn web (or similar script defined in package.json)
```
If not configured, you would need to add `react-native-web` and configure your bundler (e.g., Webpack or Metro) accordingly. This is an advanced setup.

## Generating Production Builds (React Native)

### Generating Android App Bundle (.aab)

The `.aab` file is used to publish your app on the Google Play Store.

1.  **Navigate to the `android` directory:**
    ```bash
    cd android
    ```

2.  **Clean the project (optional but recommended):**
    ```bash
    ./gradlew clean
    ```

3.  **Generate the release AAB:**
    ```bash
    ./gradlew bundleRelease
    ```
    The generated `.aab` file will be located at `android/app/build/outputs/bundle/release/app-release.aab`.

    **Important:** This command signs the app using the release keystore. Ensure your keystore is correctly configured in `android/app/build.gradle` and the keystore file itself is present.

### Modifying the Keystore (Android)

The keystore is a binary file that contains a set_of private keys used to sign your Android application for release.

1.  **Location:** The keystore file (e.g., `my-release-key.keystore`) is typically stored in the `android/app` directory. **It should not be committed to version control if it's your production keystore.**
2.  **Configuration:** Keystore details (store password, key alias, key password) are configured in the `android/app/build.gradle` file, usually within the `signingConfigs` block for the `release` build type.
    ```gradle
    ...
    android {
        ...
        signingConfigs {
            release {
                if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                    storeFile file(MYAPP_RELEASE_STORE_FILE)
                    storePassword MYAPP_RELEASE_STORE_PASSWORD
                    keyAlias MYAPP_RELEASE_KEY_ALIAS
                    keyPassword MYAPP_RELEASE_KEY_PASSWORD
                }
            }
        }
        buildTypes {
            release {
                ...
                signingConfig signingConfigs.release
            }
        }
    }
    ```
    These properties (`MYAPP_RELEASE_STORE_FILE`, `MYAPP_RELEASE_STORE_PASSWORD`, etc.) are typically defined in a `gradle.properties` file (e.g., `~/.gradle/gradle.properties` or `android/gradle.properties`) to keep them out of version control:
    ```properties
    MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
    MYAPP_RELEASE_STORE_PASSWORD=your_store_password
    MYAPP_RELEASE_KEY_ALIAS=your_key_alias
    MYAPP_RELEASE_KEY_PASSWORD=your_key_password
    ```
3.  **Generating a new Keystore:** If you need to generate a new keystore, you can use the `keytool` command (part of the Java Development Kit - JDK):
    ```bash
    keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
    ```
    You will be prompted for passwords and distinguished name information. Place the generated `.keystore` file in `android/app` and update `build.gradle` and `gradle.properties` accordingly.

## Configuring Backend and Hugging Face Variables (Frontend)

The frontend application will need to know where the backend is running and potentially any client-side specific keys or configurations for services like Hugging Face (though API keys should ideally be proxied through your backend).

1.  **Backend URL:**
    -   The primary configuration is the backend API endpoint. This is usually stored in a configuration file within the frontend codebase (e.g., `src/config.js` or `app/config/constants.js`).
    -   **Example (`src/config.js`):**
        ```javascript
        const API_URL = 'http://localhost:5000/api'; // For local development

        // For production, you might use:
        // const API_URL = 'https://your-production-backend.com/api';

        export { API_URL };
        ```
    -   Ensure your frontend code uses this `API_URL` when making requests.

2.  **Hugging Face Variables (Client-Side):**
    -   **It is strongly recommended NOT to embed `HF_API_KEY` directly in the frontend.** All interactions requiring the API key should go through your backend server to protect the key.
    -   If there are client-side specific Hugging Face model IDs or other non-sensitive configurations, they can also be stored in the frontend config file.
        **Example (`src/config.js`):**
        ```javascript
        // ... (API_URL as above)

        const HF_MODEL_FOR_DISPLAY = 'Example Model Name'; // Non-sensitive info

        export { API_URL, HF_MODEL_FOR_DISPLAY };
        ```

## Testing Key Features

To ensure the application is working correctly, test the following flows:

1.  **User Login:**
    -   Attempt to register a new user.
    -   Log in with the newly created user credentials.
    -   Log in using Google OAuth (if configured and enabled on the frontend).
    -   Verify that a JWT token is received upon successful login and stored/used by the frontend for subsequent authenticated requests.

2.  **Image Generation:**
    -   Log in as a user.
    -   Navigate to the image generation screen.
    -   Upload an image.
    -   Trigger the "effect" or "generation" process.
    -   Verify that the (simulated) generated image is displayed or a link to it is provided.
    -   Check that the user's credit balance is deducted correctly.
    -   Test edge cases: trying to generate an image with insufficient credits.

3.  **Credits System:**
    -   Verify new users receive the default amount of credits upon registration.
    -   Confirm credit deduction after successful image generation.
    -   If there's a way to view current credits, ensure it displays the correct amount.

---

### ❗IMPORTANT NOTES FOR DEVELOPMENT:

-   ✅ **Backend Ready:** The backend is already set up and functional. Do not attempt to recreate or significantly modify its core structure unless specifically instructed.
-   ✅ **JavaScript Only:** All new frontend and backend logic should be written in **JavaScript**. Do **NOT** use TypeScript.
-   ✅ **No Expo:** This is a React Native CLI project. Do **NOT** use Expo or Expo-specific libraries/commands unless they are explicitly compatible and required.
-   ✅ **Local Backend URL:** For local development, the frontend must connect to the backend at `http://localhost:5000`. Ensure any proxy configurations or API constants in the frontend reflect this.

---

## API Endpoints

The following are the main API endpoints available:

-   **Authentication (`/api/auth`):**
    -   `POST /register`: Register a new user.
        -   Body: `{ "email": "user@example.com", "password": "password123", "nombre": "Test User" }`
    -   `POST /login`: Log in an existing user.
        -   Body: `{ "email": "user@example.com", "password": "password123" }`
    -   `GET /google`: Initiates Google OAuth 2.0 login flow. (Redirects to Google)
    -   `GET /google/callback`: Callback URL for Google OAuth. (Google redirects here after authentication)
    -   `GET /google/failure`: Route where user is redirected if Google Auth fails on server side.

-   **Hugging Face Image Generation (`/api/hg`):**
    -   `POST /make-it-now`: Upload an image to apply an AI effect.
        -   Requires Authentication: `Bearer <JWT_TOKEN>` in Authorization header.
        -   Request type: `multipart/form-data`.
        -   Field: `image` (containing the image file).
        -   Checks for sufficient user credits.
        -   (Currently simulates image processing)
        -   Returns the URL of the generated image and remaining credits.

## Environment Variables for Production

When deploying to a production environment:

-   **Change all default secrets and credentials** in your `.env` file, especially `JWT_SECRET`, `DB_PASSWORD`, `GOOGLE_CLIENT_SECRET`, and `HF_API_KEY`.
-   Set `NODE_ENV=production` in your environment. This can sometimes enable optimizations in libraries like Express.
-   Ensure your `.env` file is kept secure and is not committed to your repository if it contains sensitive production keys. Use environment variable management provided by your hosting platform.
-   Consider using a more robust database migration tool (like Sequelize CLI, Flyway, or Liquibase for MySQL) than the automatic table creation in `config/db.js` (intended for development) for production deployments.

## Backend and Frontend Connectivity

-   The backend is prepared to run on `127.0.0.1:5000`.
-   If you have a frontend application, ensure it connects to `http://localhost:5000` (or your configured backend URL) and handles CORS (Cross-Origin Resource Sharing) if they are on different domains/ports. CORS has not been explicitly configured in this backend; you might need to add the `cors` middleware in `app.js`:
    ```javascript
    // In app.js
    // const cors = require('cors');
    // app.use(cors()); // Basic open CORS for development
    // For production, configure CORS options more restrictively.
    ```

This README provides a basic guide. Further customization and features can be added as needed.
