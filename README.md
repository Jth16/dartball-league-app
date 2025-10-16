# Dartball League App

This project is a web application for managing a dartball league. It consists of a backend built with Flask and a frontend developed using React. The application allows users to view team statistics and provides an admin interface for updating team records.

## Project Structure

```
dartball-league-app
├── backend
│   ├── app.py               # Entry point for the backend application
│   ├── models.py            # Database models using SQLAlchemy
│   ├── routes.py            # API routes for fetching data and admin actions
│   ├── requirements.txt      # Python dependencies for the backend
│   └── README.md            # Documentation for the backend setup and usage
├── frontend
│   ├── src
│   │   ├── components
│   │   │   ├── TeamsTable.jsx # Component to display teams and their records
│   │   │   └── AdminLogin.jsx  # Component for admin login and record submission
│   │   ├── App.jsx           # Main React component for routing
│   │   ├── index.js          # Entry point for the React application
│   │   └── README.md         # Documentation for the frontend setup and usage
│   ├── package.json          # Configuration file for npm
│   └── README.md             # Documentation for the frontend setup and usage
├── database
│   └── schema.sql           # SQL schema for the database
└── README.md                 # Overall documentation for the project
```

## Getting Started

### Backend Setup

1. Navigate to the `backend` directory.
2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Run the application:
   ```
   python app.py
   ```

### Frontend Setup

1. Navigate to the `frontend` directory.
2. Install the required dependencies:
   ```
   npm install
   ```
3. Start the React application:
   ```
   npm start
   ```

## Features

- View a list of teams with their win, loss, and games behind records.
- Admin login interface for updating team records.

## Database

The database schema is defined in `database/schema.sql`. Make sure to set up your database according to the schema before running the application.

## Contributing

Feel free to submit issues or pull requests for improvements or bug fixes.