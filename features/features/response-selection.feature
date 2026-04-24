Feature: Response Selection and Continuation
  As a user
  I want to select a response and continue the conversation
  So that I can have meaningful multi-turn conversations

  Background:
    Given I am logged in
    And I have an active conversation

  Scenario: Select a response and continue
    When I send a message "How do I learn Python?"
    And I select the "concise" response option
    Then the selected response should appear in the chat
    And I should see a "Continue" button
    When I click the continue button
    Then I should be able to type a follow-up message

  Scenario: Continue conversation after selection
    Given I have selected a response to "What is AI?"
    When I send a follow-up message "Give me an example"
    Then the new message should be added to the same conversation
    And the bot should respond with a new message

  Scenario: Select different response types
    When I send a message "Explain recursion"
    And I select the "detailed" response option
    Then the response should contain step-by-step explanation
    And the conversation should continue normally

  Scenario: Selection preserves conversation history
    When I send a message "Tell me about dogs"
    And I select the "creative" response option
    Then the response should be stored in the database
    When I refresh the page
    Then the selected response should still be visible

  Scenario: Select creative response and continue
    When I send a message "Tell me a story about space"
    And I select the "creative" response option
    Then I send a message "Continue the story"
    Then the bot should extend the story naturally

  Scenario: Cannot select response without options
    When I try to select a response before generating options
    Then no selection should be possible
    And I should see an error message

  Scenario: Each response option is selectable
    When I send a message "What is machine learning?"
    Then I should be able to select the "concise" option
    And I should be able to select the "detailed" option
    And I should be able to select the "creative" option

  Scenario: Response selection saves to chat history
    When I send a message "Explain gravity"
    And I select the "detailed" response option
    Then the user message should be saved
    And the selected bot response should be saved
    When I view the chat later
    Then both messages should appear in the conversation

  Scenario: Multiple rounds of selection
    When I send a message "Tell me about planets"
    And I select a response
    Then I send a message "Tell me about stars"
    And I should see new response options for the follow-up query
    And I should be able to select another response
