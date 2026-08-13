# Interngram

An internship portal that connects students with companies, utilizing AI to parse resumes and automatically extract skills for streamlined matching.

## Installation

### Prerequisites
- Node.js (v18+)
- MongoDB instance

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd internship-portal

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

## Configuration

Create a `.env` file in the `server/` directory:

| Variable | Description |
| :--- | :--- |
| `MONGODB_URI` | Connection string for your MongoDB instance |
| `GEMINI_API_KEY` | API Key for Google Generative AI |
| `JWT_SECRET` | Secret key used for signing authentication tokens |

## Usage

### Starting the Development Environment

```bash
# Start the server
cd server
npm start

# Start the client
cd ../client
npm run dev
```

### API Usage Example

The server provides REST endpoints for authentication and application management. Example request to register a student:

```javascript
// POST /api/student/register
fetch('http://localhost:5000/api/student/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'securePassword123'
  })
});
```

## Project Structure

- `server/`: Express backend API and data models.
  - `models/`: Mongoose schemas (Application, Company, Job, Student, etc.).
  - `middleware/`: Authentication logic.
  - `uploads/`: Storage for resume PDFs.
- `client/`: React frontend application.
  - `components/`: UI components (Analytics, StudentProfile, etc.).
  - `context/`: Global state (Auth, Toast).
  - `pages/`: Route-level views (Dashboard, Login, Register).

## Known Limitations

- **Resume Parsing:** Parsing is strictly limited to PDF file formats.
- **Authentication:** Password recovery and email verification workflows are not yet implemented.
- **Scalability:** File uploads are stored locally in the `server/uploads/` directory; this is not suitable for production deployment with multiple instances.
