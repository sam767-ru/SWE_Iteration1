Feature: Conversation Persistence
  As a user
  I want my conversations to persist across sessions
  So that I never lose my chat history

  Background:
    Given I am logged in

  Scenario: Conversation remains after refresh (existing test)
    Given I have an active conversation
    When I refresh the page
    Then my conversation should still be available

  Scenario: Multiple conversations preserved
    Given I have created 3 different conversations
    When I refresh the page
    Then all 3 conversations should appear in my chat list

  Scenario: Selected response persists after refresh
    Given I have selected a response to a query
    When I refresh the page
    Then the selected response should still be visible

  Scenario: Conversation continues after browser restart
    Given I have an active conversation
    When I close and reopen the browser
    And I log in again
    Then my previous conversation should still be available

  Scenario: Chat title persists after refresh
    Given I have renamed a chat to "Persistent Title"
    When I refresh the page
    Then the chat should still be named "Persistent Title"

  Scenario: Long conversation history persists
    Given I have a conversation with 50 messages
    When I refresh the page
    Then all 50 messages should still be visible
    And the chat should scroll to the bottom

  Scenario: Deleted chat stays deleted after refresh
    Given I delete a chat
    When I refresh the page
    Then the deleted chat should not reappear

  Scenario: Conversation persists across multiple sessions
    Given I have an active conversation
    When I log out
    And I log in again with the same account
    Then my previous conversation should still be available

  Scenario: Different users have different conversations
    Given I have a conversation as "user1"
    When I log out
    And I log in as "user2"
    Then I should not see user1's conversations
    And user2 should have their own empty chat list

  Scenario: Messages maintain order after persistence
    Given I have sent messages in order: "First", "Second", "Third"
    When I refresh the page
    Then the messages should appear in the correct order

  Scenario: Pending response options do not persist
    Given I have generated response options but not selected one
    When I refresh the page
    Then the response options should not appear
    And the user message should still be visible
