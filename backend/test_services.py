#!/usr/bin/env python3
"""
Test script for the refactored services architecture.

Tests:
1. Services can be imported
2. Matchmaking queue works correctly
3. Matchmaking polling bug is fixed
4. Game creation works
5. All services integrate properly

Run: python3 test_services.py
"""

import sys
from typing import Dict

# Import services
try:
    from backend_app.services import (
        game_service,
        lobby_service,
        matchmaking_service,
        ai_service,
        ValidationError,
        NotFoundError,
    )
    print("✅ All services imported successfully\n")
except ImportError as e:
    print(f"❌ Import failed: {e}")
    sys.exit(1)


def test_matchmaking_bug_fix():
    """Test that the matchmaking polling bug is fixed."""
    print("=" * 70)
    print("TEST 1: Matchmaking Polling Bug Fix")
    print("=" * 70)
    
    # Clear any existing state
    matchmaking_service._queue.clear()
    matchmaking_service._matched_players.clear()
    
    # Step 1: Player 1 joins
    print("\n[Step 1] Player 1 joins queue...")
    result1 = matchmaking_service.join_queue("TestPlayer1")
    assert result1["status"] == "queued", f"❌ Expected queued, got {result1['status']}"
    print(f"  Status: {result1['status']}, Position: {result1['position']}")
    
    # Step 2: Player 1 polls (still alone)
    print("\n[Step 2] Player 1 polls (still waiting)...")
    result2 = matchmaking_service.join_queue("TestPlayer1")
    assert result2["status"] == "queued", f"❌ Expected queued, got {result2['status']}"
    assert result2["position"] == 1, f"❌ Position should be 1, got {result2['position']}"
    print(f"  Status: {result2['status']}, Position: {result2['position']}")
    
    # Step 3: Player 2 joins (creates match)
    print("\n[Step 3] Player 2 joins (creates match)...")
    result3 = matchmaking_service.join_queue("TestPlayer2")
    assert result3["status"] == "matched", f"❌ Expected matched, got {result3['status']}"
    game_id = result3["game"].id
    players = result3["game"].players
    print(f"  Status: {result3['status']}")
    print(f"  Game ID: {game_id}")
    print(f"  Players: {players}")
    
    # Step 4: THE CRITICAL TEST - Player 1 polls again
    print("\n[Step 4] 🔥 CRITICAL: Player 1 polls again (should get match)...")
    result4 = matchmaking_service.join_queue("TestPlayer1")
    
    if result4["status"] == "matched":
        matched_game_id = result4["game"].id
        assert matched_game_id == game_id, f"❌ Game IDs don't match: {matched_game_id} != {game_id}"
        print(f"  ✅ ✅ ✅ BUG FIXED! Player 1 received the match!")
        print(f"  Game ID: {matched_game_id}")
        print(f"  Status: {result4['status']}")
        return True
    elif result4["status"] == "queued":
        print(f"  ❌ ❌ ❌ BUG STILL EXISTS! Player 1 re-queued!")
        print(f"  Position: {result4['position']}")
        return False
    else:
        print(f"  ❌ Unexpected status: {result4['status']}")
        return False


def test_game_service():
    """Test game service functionality."""
    print("\n" + "=" * 70)
    print("TEST 2: Game Service")
    print("=" * 70)
    
    # Create game
    print("\n[Creating game]...")
    game = game_service.create_game(
        players=["Alice", "Bob"],
        assigned_image="https://example.com/image.jpg",
        source="test"
    )
    print(f"  Game ID: {game.id}")
    print(f"  Players: {game.players}")
    print(f"  Status: {game.status}")
    
    # Get game
    print("\n[Retrieving game]...")
    retrieved = game_service.get_game(game.id)
    assert retrieved.id == game.id, "❌ Game IDs don't match"
    print(f"  ✅ Retrieved game: {retrieved.id}")
    
    # Record prompts
    print("\n[Recording prompts]...")
    game = game_service.record_prompt(game.id, "Alice", "Create a space website")
    print(f"  Alice's prompt recorded")
    game = game_service.record_prompt(game.id, "Bob", "Build a retro game site")
    print(f"  Bob's prompt recorded")
    print(f"  Prompts: {list(game.prompts.keys())}")
    
    print("\n  ✅ Game service works correctly")
    return True


def test_lobby_service():
    """Test lobby service functionality."""
    print("\n" + "=" * 70)
    print("TEST 3: Lobby Service")
    print("=" * 70)
    
    # Create lobby
    print("\n[Creating lobby]...")
    lobby = lobby_service.create_lobby("HostPlayer")
    print(f"  Lobby ID: {lobby.id}")
    print(f"  Host: {lobby.host}")
    print(f"  Status: {lobby.status}")
    
    # Join lobby
    print("\n[Joining lobby]...")
    lobby = lobby_service.join_lobby(lobby.id, "GuestPlayer")
    print(f"  Players: {lobby.players}")
    print(f"  Status: {lobby.status}")
    assert len(lobby.players) == 2, "❌ Should have 2 players"
    
    # Toggle ready
    print("\n[Toggle ready states]...")
    lobby = lobby_service.toggle_ready(lobby.id, "HostPlayer")
    lobby = lobby_service.toggle_ready(lobby.id, "GuestPlayer")
    print(f"  Ready state: {lobby.ready_state}")
    print(f"  Status: {lobby.status}")
    
    print("\n  ✅ Lobby service works correctly")
    return True


def test_ai_service():
    """Test AI service functionality."""
    print("\n" + "=" * 70)
    print("TEST 4: AI Service")
    print("=" * 70)
    
    # Create game
    print("\n[Creating game for AI test]...")
    game = game_service.create_game(["Player1", "Player2"], source="ai_test")
    print(f"  Game ID: {game.id}")
    
    # Submit first prompt
    print("\n[Submitting first prompt]...")
    game = ai_service.submit_prompt(game.id, "Player1", "Make a cool website")
    print(f"  Game status: {game.status}")
    assert game.status == "pending", f"❌ Should be pending, got {game.status}"
    
    # Submit second prompt (triggers AI processing)
    print("\n[Submitting second prompt - triggers AI]...")
    game = ai_service.submit_prompt(game.id, "Player2", "Create an awesome app")
    print(f"  Game status: {game.status}")
    print(f"  Outputs generated: {len(game.outputs)}")
    print(f"  Scores: {game.scores}")
    print(f"  Winner: {game.winner}")
    assert game.status == "completed", f"❌ Should be completed, got {game.status}"
    
    print("\n  ✅ AI service works correctly")
    return True


def test_cancel_functionality():
    """Test matchmaking cancel functionality."""
    print("\n" + "=" * 70)
    print("TEST 5: Matchmaking Cancel")
    print("=" * 70)
    
    # Clear state
    matchmaking_service._queue.clear()
    matchmaking_service._matched_players.clear()
    
    # Join queue
    print("\n[Player joins queue]...")
    result = matchmaking_service.join_queue("CancelTest")
    assert result["status"] == "queued"
    print(f"  Status: {result['status']}")
    
    # Cancel
    print("\n[Player cancels]...")
    result = matchmaking_service.cancel("CancelTest")
    assert result["status"] == "removed"
    print(f"  Status: {result['status']}")
    
    # Try to cancel again (idempotent)
    print("\n[Cancel again (idempotent)]...")
    result = matchmaking_service.cancel("CancelTest")
    assert result["status"] == "absent"
    print(f"  Status: {result['status']}")
    
    print("\n  ✅ Cancel functionality works correctly")
    return True


def main():
    """Run all tests."""
    print("\n" + "🧪" * 35)
    print(" " * 10 + "SERVICE ARCHITECTURE TESTS")
    print("🧪" * 35 + "\n")
    
    tests = [
        ("Matchmaking Bug Fix", test_matchmaking_bug_fix),
        ("Game Service", test_game_service),
        ("Lobby Service", test_lobby_service),
        ("AI Service", test_ai_service),
        ("Cancel Functionality", test_cancel_functionality),
    ]
    
    results: Dict[str, bool] = {}
    
    for name, test_func in tests:
        try:
            results[name] = test_func()
        except Exception as e:
            print(f"\n  ❌ Test failed with exception: {e}")
            import traceback
            traceback.print_exc()
            results[name] = False
    
    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    
    for name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status}: {name}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n" + "🎉" * 35)
        print(" " * 10 + "ALL TESTS PASSED!")
        print("🎉" * 35)
        return 0
    else:
        print("\n" + "❌" * 35)
        print(" " * 10 + "SOME TESTS FAILED")
        print("❌" * 35)
        return 1


if __name__ == "__main__":
    sys.exit(main())

