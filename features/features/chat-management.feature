Feature: Chat Management (Save and Delete)
  As a user
  I want to save and delete my chats
  So that I can organize my conversation history

  Background:
    Given I am logged in
    And I have a previous conversation

  Scenario: Save/rename a chat
    Given I am viewing my chat list
    When I click the save button on a chat
    And I enter a new title "My Important Chat"
    Then the chat title should update to "My Important Chat"
    And the chat should appear with the new title in the list

  Scenario: Delete a chat
    Given I have at least one chat in my list
    When I click the delete button on a chat
    And I confirm the deletion
    Then the chat should be removed from the list
    And the chat should no longer be accessible

  Scenario: Delete active chat
    Given I am viewing a chat
    When I delete the current chat
    Then the chat window should clear
    And another chat should be selected automatically if available

  Scenario: Save empty chat
    Given I create a new chat
    When I try to save it without sending any messages
    Then the save should still work with a default title

  Scenario: Duplicate chat titles allowed
    Given I have a chat named "Study Notes"
    When I save another chat as "Study Notes"
    Then both chats should exist with the same title

  Scenario: Cancel chat deletion
    Given I have at least one chat in my list
    When I click the delete button on a chat
    And I cancel the deletion
    Then the chat should remain in the list
    And the chat should still be accessible

  Scenario: Save chat with special characters
    Given I am viewing my chat list
    When I click the save button on a chat
    And I enter a new title "Chat #1: Important!!!"
    Then the chat title should save with special characters
    And the title should display correctly

  Scenario: Delete all chats
    Given I have multiple chats in my list
    When I delete each chat one by one
    Then the chat list should become empty
    And I should see a welcome message in the chat area

  Scenario: Save chat after conversation
    Given I have an active conversation with multiple messages
    When I save the chat with title "Long Conversation"
    Then the chat should save all messages
    And the title should persist after page refresh

  Scenario: Cannot save chat with empty title
    Given I am viewing my chat list
    When I click the save button on a chat
    And I try to save with an empty title
    Then the save should be rejected
    And I should see an error message
