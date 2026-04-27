## Problem Statement: AI-Powered Restaurant Recommendation System (Zomato Use Case)

Build an AI-powered restaurant recommendation system inspired by Zomato.  
The application should combine structured restaurant data with a Large Language Model (LLM) to provide personalized, human-readable recommendations based on user preferences.

## Objective

Design and implement an application that can:

- Collect user preferences (location, budget, cuisine, rating, and optional needs)
- Use a real-world restaurant dataset
- Generate personalized recommendations using an LLM
- Present clear, actionable results to the user

## System Workflow

### 1) Data Ingestion

- Load and preprocess the Zomato dataset from Hugging Face:  
  [https://huggingface.co/datasets/ManikaSaini/zomato-restaurant-recommendation](https://huggingface.co/datasets/ManikaSaini/zomato-restaurant-recommendation)
- Extract and normalize important fields such as:
  - Restaurant name
  - Location
  - Cuisine
  - Cost
  - Rating

### 2) User Input

Collect preferences from the user, including:

- Location (for example, Delhi or Bangalore)
- Budget range (low, medium, high)
- Preferred cuisine (for example, Italian or Chinese)
- Minimum acceptable rating
- Additional preferences (for example, family-friendly, quick service)

### 3) Integration Layer

- Filter restaurants using the structured constraints from user input
- Prepare the filtered records in a prompt-friendly format
- Send the structured context to the LLM with a prompt designed to rank and justify recommendations

### 4) Recommendation Engine

Use the LLM to:

- Rank the most relevant restaurants
- Explain why each recommendation matches the user's preferences
- Optionally provide a short comparative summary of the top choices

### 5) Output Display

Display top recommendations in a user-friendly format with:

- Restaurant name
- Cuisine
- Rating
- Estimated cost
- AI-generated explanation
