# 🎬 Movie Recommender

A full-stack movie recommendation system built with a collaborative filtering model (SVD), a FastAPI backend, a PostgreSQL database, and a React frontend — fully deployed and live.

**🔗 Live demo:** https://movie-recommender-phi-seven.vercel.app/
**🔗 API:** https://movie-recommender-api-5qmo.onrender.com/
**🔗 Source:** https://github.com/Sotry2666/movie-recommender

> **Note:** The backend is hosted on Render's free tier, which spins down after periods of inactivity. The first request may take 30–60 seconds while the server wakes up.

---

## Overview

This project builds a movie recommendation engine using the [MovieLens](https://grouplens.org/datasets/movielens/) dataset. Given a user's rating history, it recommends movies they're likely to enjoy using a collaborative filtering model trained with Singular Value Decomposition (SVD), and lets users submit new ratings that are persisted to a live database.

The goal was to build the full pipeline end to end — from raw data to a deployed, usable application — rather than stopping at a notebook.

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐      ┌────────────────┐
│   React     │ ───▶ │   FastAPI    │ ───▶ │  Trained SVD    │      │   PostgreSQL   │
│  (Vercel)   │ ◀─── │  (Render)    │ ◀─── │  Model (.pkl)   │      │    (Neon)      │
└─────────────┘      └──────┬───────┘      └─────────────────┘      └────────┬───────┘
                             │                                                │
                             └────────────────────────────────────────────────┘
                                   reads movies/ratings, writes new ratings
```

- **Frontend (React + Vite, hosted on Vercel):** lets a user request recommendations by user ID, and submit new ratings.
- **Backend (FastAPI, hosted on Render):** serves predictions from the trained model and exposes an endpoint for submitting new ratings.
- **Database (PostgreSQL, hosted on Neon):** stores the MovieLens ratings/movies data and any new ratings submitted through the app.
- **Model:** trained offline in a Jupyter notebook, serialized with `pickle`, and loaded by the API at startup.

## Data

- **Source:** [MovieLens Latest Small](https://grouplens.org/datasets/movielens/latest/) — 100,836 ratings across 9,742 movies from 610 users.
- **Sparsity:** ~98.3% of the user-movie ratings matrix is empty — most users have rated only a small fraction of available movies, which is the core challenge collaborative filtering is designed to address.

## Modeling Approach

1. **Popularity baseline** — ranks movies using a Bayesian-adjusted average (blending each movie's rating with two "prior" ratings of 5 and 0), which naturally down-weights movies with very few ratings without requiring an arbitrary cutoff.
2. **Collaborative filtering (SVD)** — trained using the [`surprise`](http://surpriselib.com/) library. The model learns latent factors for users and movies from the sparse ratings matrix and predicts ratings for unseen user-movie pairs.

## Results

| Metric | SVD Model | Baseline (Random) |
|---|---|---|
| RMSE | 0.8807 | 1.4296 |
| MAE | 0.6766 | 1.1407 |
| Precision@10 | 0.745 | — |
| Recall@10 | 0.509 | — |

The SVD model substantially outperforms a naive random-guess baseline on both RMSE and MAE, confirming it's learning genuine patterns in user taste rather than just approximating the overall rating distribution. At Precision@10 = 0.745, roughly 3 out of every 4 recommended movies in a user's top 10 are ones they'd rate 3.5 stars or higher.

## Features

- **`GET /recommend/{user_id}`** — returns the top N movies a given user hasn't rated yet, ranked by predicted rating.
- **`POST /rate`** — accepts a new rating (`user_id`, `movie_id`, `rating`) and persists it to PostgreSQL. Newly rated movies are immediately excluded from that user's future recommendations.
- Interactive API docs available at `/docs` (FastAPI's auto-generated Swagger UI).

## Tech Stack

- **Language:** Python, JavaScript
- **Data/ML:** pandas, NumPy, scikit-learn, scikit-surprise
- **Backend:** FastAPI, SQLAlchemy, Uvicorn
- **Database:** PostgreSQL (Neon)
- **Frontend:** React (Vite)
- **Deployment:** Render (API), Vercel (frontend), Neon (database)
- **Tooling:** Jupyter, Git/GitHub, conda

## Project Structure

```
movie-recommender/
├── api/                  # FastAPI backend
│   └── main.py
├── frontend/             # React frontend
│   └── src/App.jsx
├── models/               # Trained model (serialized)
│   └── svd_model.pkl
├── notebooks/            # Data exploration, training, evaluation
│   └── 01_exploration.ipynb
├── data/raw/             # MovieLens dataset
└── README.md
```

## Running Locally

**Backend:**
```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Both require a `.env` file at the project root with database credentials (see `.env.example` if provided, or the connection variables referenced in `api/main.py`).

## Known Limitations & Future Work

- **Model freshness:** the SVD model is trained offline and does not update in real time. New ratings are persisted and immediately affect *which* movies are eligible for recommendation, but predicted ratings themselves only reflect what the model knew at training time. A production version of this system would retrain on a schedule (e.g., nightly) rather than per-request, which is standard practice for collaborative filtering systems at scale.
- **Cold start:** new users or movies with no ratings can't be meaningfully recommended by collaborative filtering alone; a hybrid approach (blending in the content-based/popularity baseline) would help here.
- **Scale:** currently uses the "small" MovieLens dataset (100K ratings); the pipeline is designed to scale to the 25M-rating version with minimal changes.

## What This Project Demonstrates

- End-to-end data science workflow: exploration, baseline comparison, model training, and rigorous evaluation (not just "the model runs").
- Full-stack software engineering: a REST API, a relational database, and a deployed frontend, wired together.
- Real-world debugging across the stack — environment management, CORS, database migrations, and cloud deployment.
