sqlite3 league.db < ../database/schema.sql# Dartball League App Backend

This is the backend for the Dartball League application, built using Flask and SQLAlchemy. It provides an API for managing teams and their records.

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd dartball-league-app/backend
   ```

2. **Create a virtual environment:**
   ```
  
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install dependencies:**
   ```
   pip install -r requirements.txt
   ```

4. **Set up the database:**
   - Create the database using the schema defined in `../database/schema.sql`.

5. **Run the application:**
   ```
   python app.py
   ```

## API Endpoints

- **GET /teams**: Fetches the list of teams with their records.
- **POST /admin/login**: Authenticates the admin user.
- **POST /teams**: Submits new team records (admin only).

## Database Models

The application uses SQLAlchemy to define the database models. The main model is `Team`, which includes:
- `id`: Unique identifier for the team.
- `name`: Name of the team.
- `wins`: Number of wins.
- `losses`: Number of losses.
- `games_behind`: Games behind the leader.

## Contributing

Feel free to submit issues or pull requests for improvements or bug fixes.