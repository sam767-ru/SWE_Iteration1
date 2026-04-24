Feature: Multiple Response Generation
  As a user
  I want to see multiple response options for my query
  So that I can choose the best response for my needs

  Background:
    Given I am logged in
    And I have an active conversation

  Scenario: Generate three response options for a query
    When I send a message "Explain quantum computing"
    Then I should see 3 response options
    And I should see a "concise" option
    And I should see a "detailed" option
    And I should see a "creative" option

  Scenario: Response options have different lengths
    When I send a message "Tell me about black holes"
    Then the detailed option should be longer than the concise option
    And the creative option should be unique from the other options

  Scenario: Cancel option and rephrase
    When I send a message "What is photosynthesis?"
    Then I should see response options
    When I click the cancel button
    Then the options should disappear
    And the chat input should be focused

  Scenario: Generate options in different languages
    Given I set language to "spanish"
    When I send a message "hola mundo"
    Then I should see response options in Spanish

  Scenario: Handle empty message gracefully
    When I send an empty message
    Then I should see an error message
    And no response options should be generated

  Scenario: Generate options with agent mode enabled
    Given I enable agent mode
    When I send a message "Help me plan a study schedule"
    Then the response options should be more detailed
    And each option should be at least 100 characters long

  Scenario: Options preserve conversation context
    When I send a message "I like pizza"
    And I select the concise response
    Then I send a follow-up message "What toppings do you recommend?"
    Then the bot response should reference pizza
