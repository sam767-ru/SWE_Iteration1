Feature: Multi-Model Chatbot

  Scenario: User submits a prompt and receives multiple model responses
    Given I am on the dashboard
    When I enter a prompt
    And I submit the prompt
    Then I should see responses from multiple models

  Scenario: User selects a model response
    Given multiple model responses are displayed
    When I click "Use this response"
    Then future responses should come from only that model