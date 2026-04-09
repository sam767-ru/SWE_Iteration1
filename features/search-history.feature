Feature: Search chat history
  Scenario: Search finds relevant chat
    Given I am logged in
    And I have a previous conversation
    When I search for "SearchTestMessage"
    Then relevant conversations should be displayed
