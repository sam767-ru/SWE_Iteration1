Feature: Continue previous conversations
  Scenario: New message is added to old thread
    Given I am logged in
    And I select a previous conversation
    When I send a new message
    Then the message should be added to the same conversation
