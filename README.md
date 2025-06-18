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
- [PostgreSQL](https://www.postgresql.org/) database server

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

3.  **Set up PostgreSQL Database:**
    - Ensure you have a PostgreSQL server running.
    - Create a database for this application (e.g., `ai_image_app_db`).
    - The application will attempt to create the necessary tables (`users`, `generated_images`) on startup if they don't exist.

4.  **Configure Environment Variables:**
    - Copy the example environment file to a new `.env` file:
      ```bash
      cp .env.example .env
      ```
    - Open the `.env` file and update the variables with your specific settings. Below is a description of each variable:

      | Variable                  | Description                                                                 | Example Value                                       |
      |---------------------------|-----------------------------------------------------------------------------|-----------------------------------------------------|
      | `DB_HOST`                 | Hostname of your PostgreSQL server.                                         | `localhost`                                         |
      | `DB_USER`                 | PostgreSQL username.                                                        | `your_db_user`                                      |
      | `DB_PASSWORD`             | PostgreSQL password.                                                        | `your_db_password`                                  |
      | `DB_NAME`                 | Name of the database to use.                                                | `ai_image_app_db`                                   |
      | `DB_PORT`                 | Port number for PostgreSQL.                                                 | `5432`                                              |
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

1.  **Start the server:**
    ```bash
    npm s` `tart
    ```
    (This assumes a `start` script in `package.json` like `"start": "node app.js"`)

2.  The application should now be running on the configured port (default: `http://127.0.0.1:5000` or `http://localhost:5000`).

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
-   Consider using a more robust database migration tool than the automatic table creation in `config/db.js` for production deployments.

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
