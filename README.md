# Job Application Tracker

A full-stack MERN application that helps users organize job applications, track application progress, manage follow-up dates, and monitor their job search through a dashboard.

## Live Application

- **Frontend:** [JobTrack — Live Website](https://assessment-livehost-1.onrender.com/)
- **Backend:** [Render API Service](https://assessment-livehost.onrender.com)
- **Applications API:** [View Applications](https://assessment-livehost.onrender.com/api/applications)

## Tech Stack

| Technology | Purpose |
|---|---|
| React | Frontend user interface |
| Vite | Frontend development and production builds |
| JavaScript | Application logic |
| Node.js | Backend runtime |
| Express.js | REST API and server |
| MongoDB Atlas | Database and persistent storage |
| Mongoose | MongoDB object modeling |
| Git and GitHub | Version control and source code hosting |
| Render | Frontend and backend deployment |

## Features

- **Dashboard:** Displays total applications and application statistics.
- **Application management:** Create, view, update, and delete job applications.
- **Application IDs:** Automatically generated identifiers for applications.
- **Job details:** Store company name, job role, job type, applied date, expected salary, and notes.
- **Status tracking:** Track applications through Applied, Interview, Offer, Accepted, Rejected, and Declined.
- **Status history:** Maintain a timeline of application status changes.
- **Search:** Search applications by company.
- **Filtering:** Filter applications by status.
- **Follow-up reminders:** Calculate follow-up dates and identify overdue follow-ups.
- **Data persistence:** Store application records in MongoDB Atlas.
- **Responsive interface:** A dashboard layout designed for different screen sizes.

## API Documentation

**Base URL**

`https://assessment-livehost.onrender.com/api`

| HTTP Method | Endpoint | Description |
|---|---|---|
| GET | `/applications` | Retrieve job applications |
| GET | `/applications/stats` | Retrieve dashboard statistics |
| GET | `/applications/:id` | Retrieve a specific application |
| POST | `/applications` | Create a new application |
| PUT | `/applications/:id` | Update an existing application |
| PATCH | `/applications/:id/status` | Change an application's status |
| DELETE | `/applications/:id` | Delete an application |

### Query Parameters

The applications endpoint supports the following filters:

- `search` — Search by company name.
- `status` — Filter by application status.

### Example Requests

**Retrieve all applications**

```http
GET /api/applications
```

**Search for applications by company**

```http
GET /api/applications?search=Intel
```

**Filter applications by status**

```http
GET /api/applications?status=Applied
```

**Retrieve dashboard statistics**

```http
GET /api/applications/stats
```

**Create an application**

```http
POST /api/applications
Content-Type: application/json
```

Example request body:

```json
{
  "companyName": "Example Company",
  "jobRole": "Software Engineer",
  "jobType": "Full-time",
  "appliedDate": "2026-10-28",
  "expectedSalary": 600000,
  "notes": "Applied through the company website"
}
```

**Update an application**

```http
PUT /api/applications/:id
```

**Change application status**

```http
PATCH /api/applications/:id/status
Content-Type: application/json
```

Example request body:

```json
{
  "status": "Interview"
}
```

**Delete an application**

```http
DELETE /api/applications/:id
```

All endpoint paths above are relative to the API base URL. Responses and validation rules are handled by the backend.

## Screenshots

### 1. Application Dashboard

The dashboard displays application statistics, search and filter controls, and the application list.

![JobTrack application dashboard](screenshots/dashboard.png)

### 2. Add New Application

The application form allows users to enter company information, job role, job type, applied date, expected salary, and notes.

![JobTrack add application form](screenshots/applications.png)

## Project Structure

```text
Assessment/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── src/
│   │   ├── models/
│   │   ├── routes/
│   │   └── server.js
│   └── package.json
├── screenshots/
│   ├── dashboard.png
│   └── applications.png
└── README.md
```

## Installation and Local Setup

### Prerequisites

- Node.js and npm
- MongoDB Atlas account or a compatible MongoDB instance
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Josbin26/Assessment_livehost.git
cd Assessment
```

If your cloned directory has a different name, change into that directory instead.

### 2. Configure the Backend

```bash
cd backend
npm install
```

Create a `backend/.env` file with the following variables:

```dotenv
PORT=5000
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
```

Replace the database placeholder with your own MongoDB connection string.

Start the backend:

```bash
npm start
```

The backend will run on the configured port.

### 3. Configure the Frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Configure the frontend API URL in `frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Vite will display the local development URL in the terminal.

### 4. Create a Production Build

From the frontend directory, run:

```bash
npm run build
```

The production files are generated in the `dist` directory.

## Deployment

The application is deployed using Render:

- **Frontend:** Render Static Site.
- **Backend:** Render Web Service.
- **Database:** MongoDB Atlas.

The frontend communicates with the backend through the configured API URL. Production environment variables are configured in Render.

## Environment Variables and Security

- Store production database credentials in Render environment variables.
- Do not commit real passwords, private connection strings, or other secrets.
- Use `.env` files for local development and exclude sensitive environment files from version control.
- Configure the backend's `CLIENT_URL` to match the deployed frontend origin.

## Future Improvements

- Add user authentication and individual user accounts.
- Add reminders and notifications for upcoming follow-ups.
- Add application export functionality.
- Add charts for application progress and success rates.

## Author

Developed as a full-stack MERN application project.
