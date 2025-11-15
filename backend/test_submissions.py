#!/usr/bin/env python3
"""Test script for testing score_submissions with local PNG files."""

import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from backend_app.services import ai_service, game_service

def test_score_submissions():
    """Test the score_submissions method with example PNG files."""
    
    # Check if API key is set
    if not os.getenv("GEMINI_API_KEY") and not os.getenv("GOOGLE_API_KEY"):
        print("ERROR: GEMINI_API_KEY or GOOGLE_API_KEY environment variable is not set.")
        print("Please set it before running this test.")
        return
    
    # Get the example PNG files
    example_dir = Path(__file__).parent / "example"
    png1_path = example_dir / "png1.png"
    png2_path = example_dir / "png2.png"
    
    if not png1_path.exists():
        print(f"ERROR: {png1_path} does not exist")
        return
    
    if not png2_path.exists():
        print(f"ERROR: {png2_path} does not exist")
        return
    
    print("Creating test game...")
    # Create a test game
    game = game_service.create_game(
        players=["Player1", "Player2"],
        assigned_image="test_challenge.png",
        source="manual"
    )
    
    print(f"Game created: {game.id}")
    print(f"Game players: {game.players}")
    
    # Record prompts for both players
    print("\nRecording prompts...")
    game = game_service.record_prompt(game.id, "Player1", "Create a modern login page with blue and white colors")
    game = game_service.record_prompt(game.id, "Player2", "Build a minimalist dashboard with dark theme")
    
    print(f"Player1 prompt: {game.prompts.get('Player1')}")
    print(f"Player2 prompt: {game.prompts.get('Player2')}")
    
    # Record submissions using local PNG files
    print("\nRecording submissions...")
    game, _ = game_service.record_submission(game.id, "Player1", str(png1_path.absolute()))
    print(f"Player1 submission recorded: {game.submissions.get('Player1')}")
    
    game, _ = game_service.record_submission(game.id, "Player2", str(png2_path.absolute()))
    print(f"Player2 submission recorded: {game.submissions.get('Player2')}")
    
    # Check that both submissions are recorded
    if len(game.submissions) < len(game.players):
        print(f"ERROR: Not all players have submitted. Submissions: {game.submissions}")
        return
    
    print("\n" + "="*60)
    print("Calling Gemini API to score submissions...")
    print("="*60 + "\n")
    
    try:
        # Call score_submissions
        completed_game = ai_service.score_submissions(game.id)
        
        print("✅ Scoring completed successfully!\n")
        print("="*60)
        print("RESULTS")
        print("="*60)
        print(f"\nWinner: {completed_game.winner}")
        print(f"\nTotal Scores:")
        for player, score in completed_game.scores.items():
            print(f"  {player}: {score:.2f}/100")
        
        print(f"\nCategory Scores:")
        for player in completed_game.players:
            print(f"\n  {player}:")
            cat_scores = completed_game.category_scores.get(player, {})
            for category, score in cat_scores.items():
                print(f"    {category.replace('_', ' ').title()}: {score:.2f}/20")
        
        print(f"\nFeedback for {completed_game.players[0]}:")
        feedback1 = completed_game.feedback.get(completed_game.players[0], {})
        for category, comment in feedback1.items():
            print(f"  {category.replace('_', ' ').title()}: {comment}")
        
        print(f"\nFeedback for {completed_game.players[1]}:")
        feedback2 = completed_game.feedback.get(completed_game.players[1], {})
        for category, comment in feedback2.items():
            print(f"  {category.replace('_', ' ').title()}: {comment}")
        
        print("\n" + "="*60)
        print("Full game data:")
        print("="*60)
        import json
        print(json.dumps(completed_game.to_dict(), indent=2))
        
    except Exception as e:
        print(f"\n❌ Error during scoring: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_score_submissions()

