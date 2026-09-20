import os
import pickle
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from pydantic import BaseModel

# Load .env from the project root (one level up from this file)
load_dotenv(dotenv_path='../.env')

db_user = os.getenv('DB_USER')
db_password = os.getenv('DB_PASSWORD')
db_host = os.getenv('DB_HOST')
db_port = os.getenv('DB_PORT')
db_name = os.getenv('DB_NAME')

engine = create_engine(f'postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}?sslmode=require&channel_binding=require')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://movie-recommender-phi-seven.vercel.app/"],  
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model once at startup
with open('../models/svd_model.pkl', 'rb') as f:
    model = pickle.load(f)

# Load data from Postgres instead of CSVs
movies = pd.read_sql('SELECT * FROM movies', engine)
ratings = pd.read_sql('SELECT * FROM ratings', engine)

def get_top_n_recommendations(user_id, model, movies_df, ratings_df, n=10):
    rated_movies = ratings_df[ratings_df['userId'] == user_id]['movieId'].tolist()
    all_movies = movies_df['movieId'].tolist()
    unrated_movies = [m for m in all_movies if m not in rated_movies]

    predictions = [(movie_id, model.predict(user_id, movie_id).est) for movie_id in unrated_movies]
    predictions.sort(key=lambda x: x[1], reverse=True)
    top_n = predictions[:n]

    top_n_df = pd.DataFrame(top_n, columns=['movieId', 'predicted_rating'])
    top_n_df = top_n_df.merge(movies_df, on='movieId')
    top_n_df['predicted_rating'] = top_n_df['predicted_rating'].round(2)
    return top_n_df[['title', 'predicted_rating']].to_dict(orient='records')

@app.get("/")
def read_root():
    return {"message": "Movie Recommender API is running"}

@app.get("/recommend/{user_id}")
def recommend(user_id: int, n: int = 10):
    recommendations = get_top_n_recommendations(user_id, model, movies, ratings, n)
    return {"user_id": user_id, "recommendations": recommendations}

class RatingInput(BaseModel):
    user_id: int
    movie_id: int
    rating: float

@app.post("/rate")
def submit_rating(rating_input: RatingInput):
    with engine.connect() as conn:
        conn.execute(
            text('INSERT INTO ratings ("userId", "movieId", rating, timestamp) VALUES (:uid, :mid, :r, :ts)'),
            {"uid": rating_input.user_id, "mid": rating_input.movie_id, "r": rating_input.rating, "ts": 0}
        )
        conn.commit()
    return {"message": "Rating submitted successfully"}